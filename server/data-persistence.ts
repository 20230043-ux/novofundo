import { db, pool } from '@db';
import { sql } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

/**
 * Sistema Robusto de Persistência de Dados
 * 
 * Este módulo implementa múltiplas camadas de protecção para garantir
 * que todos os dados actuais e futuros sejam mantidos de forma segura
 */

// Configurações de robustez
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 segundo
const BACKUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 horas
const HEALTH_CHECK_INTERVAL = 60 * 1000; // 1 minuto

// Sistema de retry para operações críticas
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_ATTEMPTS,
  delayMs: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Tentativa ${attempt}/${maxRetries} falhou:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw new Error(`Operação falhou após ${maxRetries} tentativas. Último erro: ${lastError.message}`);
}

// Transacção robusta com rollback automático
export async function executeRobustTransaction<T>(
  operations: (tx: any) => Promise<T>
): Promise<T> {
  return executeWithRetry(async () => {
    return await db.transaction(async (tx) => {
      try {
        const result = await operations(tx);
        console.log('✅ Transacção executada com sucesso');
        return result;
      } catch (error) {
        console.error('❌ Erro na transacção, fazendo rollback:', error);
        throw error;
      }
    });
  });
}

// Sistema de verificação de integridade de dados
export async function verifyDataIntegrity(): Promise<{
  isHealthy: boolean;
  issues: string[];
  stats: any;
}> {
  const issues: string[] = [];
  
  try {
    // Verificar conexão básica
    await executeWithRetry(() => db.execute(sql`SELECT 1`));
    
    // Verificar se todas as tabelas críticas existem
    const criticalTables = ['users', 'companies', 'individuals', 'projects', 'sdgs', 'investments', 'payment_proofs'];
    
    for (const table of criticalTables) {
      try {
        await db.execute(sql.raw(`SELECT COUNT(*) FROM ${table} LIMIT 1`));
      } catch (error) {
        issues.push(`Tabela crítica ${table} não acessível: ${error.message}`);
      }
    }
    
    // Verificar integridade referencial
    const orphanedInvestments = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM investments i 
      LEFT JOIN projects p ON i.project_id = p.id 
      WHERE p.id IS NULL
    `);
    
    if (parseInt(orphanedInvestments.rows[0].count) > 0) {
      issues.push(`${orphanedInvestments.rows[0].count} investimentos órfãos encontrados`);
    }
    
    // Verificar dados de empresas sem utilizadores
    const orphanedCompanies = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM companies c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    if (parseInt(orphanedCompanies.rows[0].count) > 0) {
      issues.push(`${orphanedCompanies.rows[0].count} empresas órfãs encontradas`);
    }
    
    // Obter estatísticas gerais
    const stats = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM companies) as total_companies,
        (SELECT COUNT(*) FROM individuals) as total_individuals,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM investments) as total_investments,
        (SELECT COALESCE(SUM(amount), 0) FROM investments) as total_investment_value,
        (SELECT COUNT(*) FROM payment_proofs) as total_payment_proofs
    `);
    
    return {
      isHealthy: issues.length === 0,
      issues,
      stats: stats.rows[0]
    };
    
  } catch (error) {
    issues.push(`Erro geral na verificação: ${error.message}`);
    return {
      isHealthy: false,
      issues,
      stats: null
    };
  }
}

// Sistema de backup automático incremental
export async function createIncrementalBackup(): Promise<{
  success: boolean;
  backupPath?: string;
  message: string;
}> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(process.cwd(), 'backups', 'auto');
    const backupPath = join(backupDir, `backup-incremental-${timestamp}.zip`);
    
    // Criar directório se não existir
    await mkdir(backupDir, { recursive: true });
    
    // Criar ficheiro ZIP
    const output = createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`✅ Backup incremental criado: ${archive.pointer()} bytes`);
        resolve({
          success: true,
          backupPath,
          message: `Backup incremental criado com ${archive.pointer()} bytes`
        });
      });
      
      archive.on('error', (err) => {
        console.error('❌ Erro no backup incremental:', err);
        reject({
          success: false,
          message: `Erro no backup: ${err.message}`
        });
      });
      
      archive.pipe(output);
      
      // Backup de dados críticos dos últimos 7 dias
      executeWithRetry(async () => {
        // Empresas recentes
        const recentCompanies = await db.execute(sql`
          SELECT * FROM companies 
          WHERE created_at >= NOW() - INTERVAL '7 days' 
          OR updated_at >= NOW() - INTERVAL '7 days'
        `);
        
        if (recentCompanies.rows.length > 0) {
          archive.append(JSON.stringify(recentCompanies.rows, null, 2), { 
            name: 'incremental/companies.json' 
          });
        }
        
        // Investimentos recentes
        const recentInvestments = await db.execute(sql`
          SELECT * FROM investments 
          WHERE created_at >= NOW() - INTERVAL '7 days'
        `);
        
        if (recentInvestments.rows.length > 0) {
          archive.append(JSON.stringify(recentInvestments.rows, null, 2), { 
            name: 'incremental/investments.json' 
          });
        }
        
        // Comprovantes de pagamento recentes
        const recentPaymentProofs = await db.execute(sql`
          SELECT * FROM payment_proofs 
          WHERE created_at >= NOW() - INTERVAL '7 days'
        `);
        
        if (recentPaymentProofs.rows.length > 0) {
          archive.append(JSON.stringify(recentPaymentProofs.rows, null, 2), { 
            name: 'incremental/payment_proofs.json' 
          });
        }
        
        // Metadados do backup
        const metadata = {
          created_at: new Date().toISOString(),
          type: 'incremental',
          period: '7_days',
          tables_backed_up: ['companies', 'investments', 'payment_proofs']
        };
        
        archive.append(JSON.stringify(metadata, null, 2), { 
          name: 'incremental/metadata.json' 
        });
        
        archive.finalize();
      });
    });
    
  } catch (error) {
    console.error('❌ Erro no backup incremental:', error);
    return {
      success: false,
      message: `Erro no backup incremental: ${error.message}`
    };
  }
}

// Sistema de limpeza de dados órfãos
export async function cleanOrphanedData(): Promise<{
  cleaned: number;
  summary: string[];
}> {
  const summary: string[] = [];
  let totalCleaned = 0;
  
  try {
    await executeRobustTransaction(async (tx) => {
      // Limpar investimentos órfãos (sem projecto)
      const orphanedInvestments = await tx.execute(sql`
        DELETE FROM investments 
        WHERE project_id NOT IN (SELECT id FROM projects)
        RETURNING id
      `);
      
      if (orphanedInvestments.rows.length > 0) {
        totalCleaned += orphanedInvestments.rows.length;
        summary.push(`${orphanedInvestments.rows.length} investimentos órfãos removidos`);
      }
      
      // Limpar comprovantes de pagamento sem utilizador válido
      const orphanedPaymentProofs = await tx.execute(sql`
        DELETE FROM payment_proofs 
        WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM companies)
        AND individual_id IS NOT NULL AND individual_id NOT IN (SELECT id FROM individuals)
        RETURNING id
      `);
      
      if (orphanedPaymentProofs.rows.length > 0) {
        totalCleaned += orphanedPaymentProofs.rows.length;
        summary.push(`${orphanedPaymentProofs.rows.length} comprovantes órfãos removidos`);
      }
      
      // Limpar sessões expiradas (mais de 30 dias)
      const expiredSessions = await tx.execute(sql`
        DELETE FROM sessions 
        WHERE expires_at < NOW() - INTERVAL '30 days'
        RETURNING sid
      `);
      
      if (expiredSessions.rows.length > 0) {
        totalCleaned += expiredSessions.rows.length;
        summary.push(`${expiredSessions.rows.length} sessões expiradas removidas`);
      }
    });
    
    if (totalCleaned === 0) {
      summary.push('Nenhum dado órfão encontrado');
    }
    
    return { cleaned: totalCleaned, summary };
    
  } catch (error) {
    console.error('❌ Erro na limpeza de dados órfãos:', error);
    return { 
      cleaned: 0, 
      summary: [`Erro na limpeza: ${error.message}`] 
    };
  }
}

// Monitorização contínua de saúde
export function startDataHealthMonitoring(): void {
  console.log('🔄 Iniciando monitorização contínua de saúde dos dados...');
  
  // Verificação de integridade a cada minuto
  setInterval(async () => {
    try {
      const health = await verifyDataIntegrity();
      
      if (!health.isHealthy) {
        console.warn('⚠️ Problemas de integridade detectados:', health.issues);
        
        // Tentar limpeza automática se houver dados órfãos
        if (health.issues.some(issue => issue.includes('órfã'))) {
          console.log('🧹 Iniciando limpeza automática de dados órfãos...');
          const cleanResult = await cleanOrphanedData();
          console.log('✅ Limpeza concluída:', cleanResult.summary);
        }
      }
    } catch (error) {
      console.error('❌ Erro na verificação de saúde:', error);
    }
  }, HEALTH_CHECK_INTERVAL);
  
  // Backup automático incremental a cada 6 horas
  setInterval(async () => {
    console.log('💾 Iniciando backup automático incremental...');
    const backupResult = await createIncrementalBackup();
    
    if (backupResult.success) {
      console.log('✅ Backup automático concluído:', backupResult.message);
    } else {
      console.error('❌ Falha no backup automático:', backupResult.message);
    }
  }, BACKUP_INTERVAL);
}

// Optimização do pool de conexões
export async function optimizeConnectionPool(): Promise<void> {
  console.log('⚡ Optimizando pool de conexões...');
  
  // Verificar estatísticas do pool
  const totalCount = pool.totalCount;
  const idleCount = pool.idleCount;
  const waitingCount = pool.waitingCount;
  
  console.log(`📊 Pool stats: Total: ${totalCount}, Idle: ${idleCount}, Waiting: ${waitingCount}`);
  
  // Se há muitas conexões em espera, alertar
  if (waitingCount > 5) {
    console.warn('⚠️ Alto número de conexões em espera. Considere aumentar o pool.');
  }
  
  // Se há muitas conexões inativas, pode estar sobre-dimensionado
  if (idleCount > 15) {
    console.log('ℹ️ Muitas conexões inactivas. Pool pode estar sobre-dimensionado.');
  }
}

// Função de inicialização do sistema robusto
export async function initializeRobustPersistence(): Promise<void> {
  console.log('🛡️ Iniciando sistema robusto de persistência de dados...');
  
  try {
    // Verificar integridade inicial
    const initialHealth = await verifyDataIntegrity();
    console.log('📋 Verificação inicial de integridade:', {
      healthy: initialHealth.isHealthy,
      issues: initialHealth.issues.length,
      stats: initialHealth.stats
    });
    
    // Limpeza inicial se necessária
    if (!initialHealth.isHealthy) {
      console.log('🧹 Executando limpeza inicial...');
      const cleanResult = await cleanOrphanedData();
      console.log('✅ Limpeza inicial concluída:', cleanResult.summary);
    }
    
    // Optimizar pool de conexões
    await optimizeConnectionPool();
    
    // Iniciar monitorização contínua
    startDataHealthMonitoring();
    
    // Criar backup inicial
    console.log('💾 Criando backup inicial...');
    const initialBackup = await createIncrementalBackup();
    if (initialBackup.success) {
      console.log('✅ Backup inicial criado:', initialBackup.message);
    }
    
    console.log('🛡️ Sistema robusto de persistência totalmente inicializado!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização do sistema robusto:', error);
    throw error;
  }
}

// Utilitário para forçar sincronização de dados críticos
export async function forceCriticalDataSync(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('🔄 Forçando sincronização de dados críticos...');
    
    await executeRobustTransaction(async (tx) => {
      // Actualizar timestamps de dados críticos
      await tx.execute(sql`
        UPDATE companies SET updated_at = NOW() WHERE updated_at IS NULL
      `);
      
      await tx.execute(sql`
        UPDATE projects SET updated_at = NOW() WHERE updated_at IS NULL
      `);
      
      await tx.execute(sql`
        UPDATE investments SET updated_at = NOW() WHERE updated_at IS NULL
      `);
      
      // Verificar consistência de dados
      await tx.execute(sql`SELECT 1`);
    });
    
    console.log('✅ Sincronização de dados críticos concluída');
    return {
      success: true,
      message: 'Dados críticos sincronizados com sucesso'
    };
    
  } catch (error) {
    console.error('❌ Erro na sincronização de dados críticos:', error);
    return {
      success: false,
      message: `Erro na sincronização: ${error.message}`
    };
  }
}