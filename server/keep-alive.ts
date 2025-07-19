import { Request, Response } from 'express';
import { db } from '@db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Keep-alive endpoint que mantém o banco de dados ativo
 * Faz uma consulta leve para evitar hibernação
 */
export const keepAliveHandler = async (req: Request, res: Response) => {
  try {
    // Consulta simples para manter o banco ativo
    const result = await db.execute(sql`SELECT 1 as alive`);
    
    const status = {
      status: 'online',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
    
    res.json(status);
  } catch (error) {
    console.error('Keep-alive error:', error);
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: 'Database connection failed' 
    });
  }
};

/**
 * Sistema automático de keep-alive interno
 * Executa consultas periódicas para manter o banco ativo
 */
export const startKeepAliveService = () => {
  const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000; // 4 minutos
  
  setInterval(async () => {
    try {
      // Consulta leve para manter o banco ativo
      await db.execute(sql`SELECT 1`);
      console.log('🔄 Keep-alive: Banco de dados mantido ativo');
    } catch (error) {
      console.error('❌ Keep-alive error:', error);
    }
  }, KEEP_ALIVE_INTERVAL);
  
  console.log('✅ Serviço keep-alive iniciado (consulta a cada 4 minutos)');
};