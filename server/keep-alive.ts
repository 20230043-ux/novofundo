import { Request, Response } from 'express';
import { db } from '@db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';
import cron from 'node-cron';
import axios from 'axios';

/**
 * Health check endpoint for external Neon Database
 * Provides system status and database connectivity
 */
export const keepAliveHandler = async (req: Request, res: Response) => {
  try {
    // Simple query to verify Neon Database connection
    const result = await db.execute(sql`SELECT 1 as alive`);
    
    const status = {
      status: 'online',
      timestamp: new Date().toISOString(),
      database: 'neon_connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
    
    res.json(status);
  } catch (error) {
    console.error('Neon Database connection error:', error);
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: 'Neon Database connection failed' 
    });
  }
};

/**
 * Keep-Alive service to prevent Render free tier hibernation
 * Otimizado para economizar horas-CU do Neon Database
 */
export const startKeepAliveService = () => {
  // OPÇÃO 1: Desativar health check do banco (economiza mais horas do Neon)
  // const ENABLE_DB_HEALTH_CHECK = false;
  
  // OPÇÃO 2: Health check do banco apenas a cada 1 hora (ao invés de 10 min)
  const ENABLE_DB_HEALTH_CHECK = true;
  const HEALTH_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hora
  
  if (ENABLE_DB_HEALTH_CHECK) {
    setInterval(async () => {
      try {
        await db.execute(sql`SELECT 1`);
        console.log('🌐 Neon Database: Conectividade verificada');
      } catch (error) {
        console.error('❌ Neon Database error:', error);
      }
    }, HEALTH_CHECK_INTERVAL);
    
    console.log(`✅ Monitoramento Neon Database iniciado (verificação a cada ${HEALTH_CHECK_INTERVAL / 60000} minutos)`);
  }

  // OPÇÃO 3: Aumentar intervalo de ping de 30s para 5 minutos
  // (Render hiberna após 15 minutos de inatividade, então 5 min é seguro)
  const PING_INTERVAL = 5 * 60 * 1000; // 5 minutos (ao invés de 30 segundos)
  
  setInterval(async () => {
    try {
      const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.REPLIT_DOMAINS;
      
      if (renderUrl) {
        const url = renderUrl.startsWith('http') ? renderUrl : `https://${renderUrl}`;
        // Usar endpoint /api/health que NÃO faz query ao banco
        const healthUrl = `${url}/api/health`;
        
        const response = await axios.get(healthUrl, { timeout: 5000 });
        console.log(`🔄 Keep-alive ping: ${new Date().toISOString()} - Status: ${response.status}`);
      } else {
        console.log('⏰ Keep-alive interno: servidor ativo', new Date().toISOString());
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Keep-alive ping falhou:', error.message);
      } else {
        console.error('❌ Erro no keep-alive:', error);
      }
    }
  }, PING_INTERVAL);

  console.log(`🚀 Serviço Keep-Alive iniciado (ping a cada ${PING_INTERVAL / 60000} minutos - otimizado para economizar Neon)`);
};