import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'jose',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'tuxtla_incidencias',
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Error inesperado en el cliente del pool:', err);
});
