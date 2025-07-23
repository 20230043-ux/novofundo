#!/usr/bin/env node

// Script para verificar e migrar base de dados
import { Pool } from 'pg';

async function checkDatabase() {
  console.log('🔍 Verificando configuração da base de dados...\n');
  
  // Verificar variáveis de ambiente
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('❌ DATABASE_URL não está configurada');
    console.log('💡 Configure a variável DATABASE_URL nas configurações do Replit');
    return;
  }
  
  console.log('✅ DATABASE_URL encontrada');
  
  // Verificar tipo de base de dados
  if (dbUrl.includes('neon.tech')) {
    console.log('🟢 Neon Database (externa - nunca hiberna) ✅');
  } else if (dbUrl.includes('supabase')) {
    console.log('🟢 Supabase (externa - nunca hiberna) ✅');
  } else {
    console.log('🔵 Base de dados personalizada detectada');
  }
  
  // Testar conexão
  console.log('\n🔌 Testando conexão...');
  const pool = new Pool({ connectionString: dbUrl });
  
  try {
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar versão PostgreSQL
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL:', versionResult.rows[0].version.split(' ')[1]);
    
    // Verificar tabelas existentes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas encontradas:');
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  Nenhuma tabela encontrada');
      console.log('🔧 Execute: npm run db:push');
    } else {
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    }
    
    // Verificar dados de exemplo
    try {
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      const companyCount = await client.query('SELECT COUNT(*) FROM companies');
      const projectCount = await client.query('SELECT COUNT(*) FROM projects');
      
      console.log('\n📈 Estatísticas dos dados:');
      console.log(`   Usuários: ${userCount.rows[0].count}`);
      console.log(`   Empresas: ${companyCount.rows[0].count}`);
      console.log(`   Projetos: ${projectCount.rows[0].count}`);
      
      if (parseInt(userCount.rows[0].count) === 0) {
        console.log('\n💡 Base de dados vazia. Execute: npm run db:seed');
      } else {
        console.log('\n✅ Base de dados externa operacional e populada!');
      }
    } catch (error) {
      console.log('\n⚠️  Algumas tabelas podem estar em falta');
      console.log('🔧 Execute: npm run db:push && npm run db:seed');
    }
    
    client.release();
    
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('   1. Verificar se a URL está correta');
    console.log('   2. Confirmar que a base de dados está ativa');
    console.log('   3. Verificar credenciais de acesso');
  } finally {
    await pool.end();
  }
}

// Executar verificação
checkDatabase().catch(console.error);