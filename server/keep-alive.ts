import { Request, Response } from 'express';
import { db } from '@db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';

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
 * Simplified health monitoring for external Neon Database
 * Since Neon never hibernates, this provides basic connectivity monitoring
 */
export const startKeepAliveService = () => {
  const HEALTH_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes (reduced frequency)
  
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
};