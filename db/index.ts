import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool for external Neon Database (never hibernates)
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 15, // Reduced for external database efficiency
  min: 3,  // Lower minimum since Neon never hibernates
  idleTimeoutMillis: 30000, // Shorter timeout for external database
  connectionTimeoutMillis: 10000, // Optimized for external connection
  // acquireTimeoutMillis: 10000, // Not available in this pg version
  keepAlive: true, // Maintain connection health
  keepAliveInitialDelayMillis: 0,
  allowExitOnIdle: false, // Maintain stability
});

// Event listeners for external database monitoring
pool.on('connect', (client) => {
  console.log('🌐 Conexão Neon Database estabelecida');
});

pool.on('error', (err, client) => {
  console.error('❌ Erro na conexão Neon:', err);
  console.log('🔄 Reconectando ao Neon Database...');
});

pool.on('remove', (client) => {
  console.log('🔌 Conexão Neon removida do pool');
});

export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? true : false
});