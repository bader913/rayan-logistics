import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import {
  ServerDatabaseConfig,
} from './setup-config.js';

export interface SetupMigrationResult {
  total: number;
  applied: number;
  skipped: number;
}

const SETUP_MIGRATION_LOCK_ID = 987654321;

function calculateChecksum(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content, 'utf8')
    .digest('hex');
}

function getMigrationFiles(): Array<{
  filename: string;
  fullPath: string;
  number: number;
}> {
  const migrationsDirectory = path.resolve(
    process.cwd(),
    'database',
    'migrations'
  );

  if (!fs.existsSync(migrationsDirectory)) {
    throw new Error(
      'لم يتم العثور على ملفات إعداد قاعدة البيانات.'
    );
  }

  return fs
    .readdirSync(migrationsDirectory)
    .filter((filename) => filename.endsWith('.sql'))
    .map((filename) => {
      const match = filename.match(/^(\d+)_.*\.sql$/);

      if (!match) {
        throw new Error(
          `اسم ملف الترحيل غير صالح: ${filename}`
        );
      }

      return {
        filename,
        fullPath: path.join(
          migrationsDirectory,
          filename
        ),
        number: Number(match[1]),
      };
    })
    .sort((first, second) => {
      return (
        first.number - second.number ||
        first.filename.localeCompare(second.filename)
      );
    });
}

export async function runSetupMigrations(
  config: ServerDatabaseConfig
): Promise<SetupMigrationResult> {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl
      ? { rejectUnauthorized: false }
      : false,
    max: 2,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  const migrationFiles = getMigrationFiles();
  let applied = 0;
  let skipped = 0;

  try {
    await client.query(
      'SELECT pg_advisory_lock($1)',
      [SETUP_MIGRATION_LOCK_ID]
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        checksum VARCHAR(64) NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL
          DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER NOT NULL DEFAULT 0
      )
    `);

    const executedResult = await client.query<{
      filename: string;
      checksum: string;
    }>(
      `SELECT filename, checksum
       FROM schema_migrations`
    );

    const executedMigrations = new Map(
      executedResult.rows.map((row) => [
        row.filename,
        row.checksum,
      ])
    );

    for (const migration of migrationFiles) {
      const sql = fs.readFileSync(
        migration.fullPath,
        'utf8'
      );

      const checksum = calculateChecksum(sql);
      const recordedChecksum =
        executedMigrations.get(migration.filename);

      if (recordedChecksum) {
        if (recordedChecksum !== checksum) {
          throw new Error(
            `تم تعديل ملف إعداد قديم: ${migration.filename}`
          );
        }

        skipped++;
        continue;
      }

      const startedAt = Date.now();

      await client.query('BEGIN');

      try {
        await client.query(sql);

        await client.query(
          `INSERT INTO schema_migrations (
             filename,
             checksum,
             execution_time_ms
           )
           VALUES ($1, $2, $3)`,
          [
            migration.filename,
            checksum,
            Date.now() - startedAt,
          ]
        );

        await client.query('COMMIT');
        applied++;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    return {
      total: migrationFiles.length,
      applied,
      skipped,
    };
  } finally {
    try {
      await client.query(
        'SELECT pg_advisory_unlock($1)',
        [SETUP_MIGRATION_LOCK_ID]
      );
    } catch {
      // Connection cleanup continues even if unlock fails.
    }

    client.release();
    await pool.end();
  }
}