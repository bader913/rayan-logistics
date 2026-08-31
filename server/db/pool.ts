// server/db/pool.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getMemoryDb } from './memory-store.js';

let pgPool: Pool | null = null;
let isPostgresHealthy: boolean | null = null;

export function getPgPool(): Pool {
  if (!pgPool) {
    const config = ENV.DATABASE_URL
      ? {
          connectionString: ENV.DATABASE_URL,
          ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : false,
          max: ENV.DB_POOL_MAX,
          idleTimeoutMillis: ENV.DB_POOL_IDLE_TIMEOUT_MS,
        }
      : {
          host: ENV.DB_HOST,
          port: ENV.DB_PORT,
          database: ENV.DB_NAME,
          user: ENV.DB_USER,
          password: ENV.DB_PASSWORD,
          ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : false,
          max: ENV.DB_POOL_MAX,
          idleTimeoutMillis: ENV.DB_POOL_IDLE_TIMEOUT_MS,
        };

    pgPool = new Pool(config);

    pgPool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pgPool;
}

export interface DbResult<T = any> {
  rows: T[];
  rowCount: number;
}

export async function checkDbConnection(): Promise<{ connected: boolean; engine: string; error?: string }> {
  try {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT current_database(), version()');
      isPostgresHealthy = true;
      return { connected: true, engine: 'PostgreSQL', error: undefined };
    } finally {
      client.release();
    }
  } catch (err: any) {
    isPostgresHealthy = false;
    return {
      connected: false,
      engine: 'In-Memory Fallback Adapter (PostgreSQL target configured)',
      error: err.message,
    };
  }
}

/**
 * Executes a parameterized SQL query with automatic fallback
 */
export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<DbResult<T>> {
  // If we haven't determined Postgres availability yet, try it
  if (isPostgresHealthy === null) {
    try {
      const pool = getPgPool();
      const res = await pool.query(sql, params);
      isPostgresHealthy = true;
      return { rows: res.rows, rowCount: res.rowCount || res.rows.length };
    } catch (err: any) {
      // Connection refused or database doesn't exist yet -> fallback
      if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000' || err.message.includes('connect')) {
        isPostgresHealthy = false;
        logger.warn('PostgreSQL server not detected locally. Routing queries to in-memory PostgreSQL emulator for active web preview.');
      } else {
        throw err;
      }
    }
  }

  if (isPostgresHealthy) {
    const pool = getPgPool();
    const res = await pool.query(sql, params);
    return { rows: res.rows, rowCount: res.rowCount || res.rows.length };
  }

  // Fallback to memory store
  const mem = getMemoryDb();
  return mem.query<T>(sql, params);
}

/**
 * Transaction helper executing callback within BEGIN ... COMMIT
 */
export async function dbTransaction<T>(callback: (query: <R = any>(sql: string, params?: any[]) => Promise<DbResult<R>>) => Promise<T>): Promise<T> {
  if (isPostgresHealthy === null) {
    await checkDbConnection();
  }

  if (isPostgresHealthy) {
    const pool = getPgPool();
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      const txQuery = async <R = any>(sql: string, params: any[] = []): Promise<DbResult<R>> => {
        const res = await client.query(sql, params);
        return { rows: res.rows, rowCount: res.rowCount || res.rows.length };
      };
      const result = await callback(txQuery);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Fallback transaction
  const mem = getMemoryDb();
  return mem.transaction<T>(callback);
}
