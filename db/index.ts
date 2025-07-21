import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Ultra-robust connection pool optimized for data persistence
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 25, // Increased for higher concurrency
  min: 8,  // Higher minimum to maintain connections
  idleTimeoutMillis: 60000, // Longer idle timeout for stability
  connectionTimeoutMillis: 15000, // Longer timeout for reliability
  acquireTimeoutMillis: 15000, // More time to acquire connections
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 0,
  allowExitOnIdle: false, // Never exit on idle to maintain persistence
});

// Event listeners for connection health monitoring
pool.on('connect', (client) => {
  console.log('🔌 Nova conexão estabelecida com a base de dados');
});

pool.on('error', (err, client) => {
  console.error('❌ Erro inesperado no cliente da base de dados:', err);
  console.log('🔄 Tentando reestabelecer conexão...');
});

pool.on('remove', (client) => {
  console.log('🔌 Conexão removida do pool');
});

export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? true : false
});