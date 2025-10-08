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
 * Pings the server every 10 minutes to keep it active
 */
export const startKeepAliveService = () => {
  const HEALTH_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes (reduced frequency)
  
  // Database health check
  setInterval(async () => {
    try {
      // Light health check for Neon Database
      await db.execute(sql`SELECT 1`);
      console.log('🌐 Neon Database: Conectividade verificada');
    } catch (error) {
      console.error('❌ Neon Database error:', error);
    }
  }, HEALTH_CHECK_INTERVAL);
  
  console.log('✅ Monitoramento Neon Database iniciado (verificação a cada 10 minutos)');

  // Self-ping para evitar hibernação do Render (free tier)
  // Pinga a cada 5 minutos (bem antes dos 15 minutos de timeout do Render)
  cron.schedule('*/5 * * * *', async () => {
    try {
      const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.REPLIT_DOMAINS;
      
      if (renderUrl) {
        const url = renderUrl.startsWith('http') ? renderUrl : `https://${renderUrl}`;
        const healthUrl = `${url}/api/health`;
        
        const response = await axios.get(healthUrl, { timeout: 5000 });
        console.log(`🔄 Keep-alive ping enviado: ${new Date().toISOString()} - Status: ${response.status}`);
      } else {
        // Ping local se não houver URL externa configurada
        console.log('⏰ Keep-alive interno: servidor ativo', new Date().toISOString());
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Keep-alive ping falhou:', error.message);
      } else {
        console.error('❌ Erro no keep-alive:', error);
      }
    }
  });

  console.log('🚀 Serviço Keep-Alive iniciado (ping a cada 5 minutos para evitar hibernação do Render)');
};