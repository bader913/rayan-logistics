// server/db/migrate-runner.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getPgPool } from './pool.js';
import { logger } from '../utils/logger.js';
import { getMemoryDb } from './memory-store.js';

export interface MigrationStatusItem {
  filename: string;
  applied: boolean;
  checksum: string;
  executedAt?: string;
  executionTimeMs?: number;
}

export interface MigrationResult {
  success: boolean;
  totalFound: number;
  appliedCount: number;
  skippedCount: number;
  appliedFiles: string[];
  error?: string;
}

const ADVISORY_LOCK_ID = 987654321;

export class MigrationRunner {
  private migrationsDir: string;

  constructor(migrationsDir?: string) {
    this.migrationsDir = migrationsDir || path.resolve(process.cwd(), 'database', 'migrations');
  }

  public calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  public getMigrationFiles(): { filename: string; fullPath: string; num: number }[] {
    if (!fs.existsSync(this.migrationsDir)) {
      throw new Error(`Migrations directory not found: ${this.migrationsDir}`);
    }

    const files = fs.readdirSync(this.migrationsDir);
    const sqlFiles = files
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const match = f.match(/^(\d+)_.+\.sql$/);
        const num = match ? parseInt(match[1], 10) : 999999;
        return {
          filename: f,
          fullPath: path.join(this.migrationsDir, f),
          num,
        };
      })
      .sort((a, b) => a.num - b.num || a.filename.localeCompare(b.filename));

    return sqlFiles;
  }

  public async getStatus(): Promise<MigrationStatusItem[]> {
    const files = this.getMigrationFiles();
    const isPg = await this.isPostgresAvailable();

    if (isPg) {
      const pool = getPgPool();
      // Ensure schema_migrations exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            checksum VARCHAR(64) NOT NULL,
            executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            execution_time_ms INTEGER NOT NULL DEFAULT 0
        );
      `);

      const res = await pool.query('SELECT filename, checksum, executed_at, execution_time_ms FROM schema_migrations ORDER BY id ASC');
      const appliedMap = new Map<string, any>(res.rows.map((r: any) => [r.filename, r]));

      return files.map((file) => {
        const content = fs.readFileSync(file.fullPath, 'utf8');
        const currentChecksum = this.calculateChecksum(content);
        const appliedRecord = appliedMap.get(file.filename);

        return {
          filename: file.filename,
          applied: !!appliedRecord,
          checksum: currentChecksum,
          executedAt: appliedRecord?.executed_at,
          executionTimeMs: appliedRecord?.execution_time_ms,
        };
      });
    } else {
      const mem = getMemoryDb();
      const appliedMap = new Map<string, any>(mem.schema_migrations.map((r: any) => [r.filename, r]));

      return files.map((file) => {
        const content = fs.readFileSync(file.fullPath, 'utf8');
        const currentChecksum = this.calculateChecksum(content);
        const appliedRecord = appliedMap.get(file.filename);

        return {
          filename: file.filename,
          applied: !!appliedRecord,
          checksum: currentChecksum,
          executedAt: appliedRecord?.executed_at,
          executionTimeMs: appliedRecord?.execution_time_ms,
        };
      });
    }
  }

  public async run(): Promise<MigrationResult> {
    const files = this.getMigrationFiles();
    const isPg = await this.isPostgresAvailable();
    const appliedFiles: string[] = [];

    if (!isPg) {
      logger.warn('Running migrations in memory-emulator mode (PostgreSQL is not connected).');
      const mem = getMemoryDb();
      for (const file of files) {
        const content = fs.readFileSync(file.fullPath, 'utf8');
        const checksum = this.calculateChecksum(content);
        const existing = mem.schema_migrations.find((m) => m.filename === file.filename);

        if (existing) {
          if (existing.checksum !== checksum) {
            throw new Error(`Integrity Violation: Migration "${file.filename}" checksum has changed since it was recorded!`);
          }
          continue;
        }

        mem.schema_migrations.push({
          id: mem.schema_migrations.length + 1,
          filename: file.filename,
          checksum,
          executed_at: new Date().toISOString(),
          execution_time_ms: 10,
        });
        appliedFiles.push(file.filename);
      }

      return {
        success: true,
        totalFound: files.length,
        appliedCount: appliedFiles.length,
        skippedCount: files.length - appliedFiles.length,
        appliedFiles,
      };
    }

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      // 1. Acquire PostgreSQL Advisory Lock
      await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_ID]);
      logger.info('Acquired PostgreSQL migration advisory lock.');

      // 2. Ensure schema_migrations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            checksum VARCHAR(64) NOT NULL,
            executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            execution_time_ms INTEGER NOT NULL DEFAULT 0
        );
      `);

      // 3. Load existing executed migrations
      const executedRes = await client.query('SELECT filename, checksum FROM schema_migrations ORDER BY id ASC');
      const executedMap = new Map<string, string>(executedRes.rows.map((r: any) => [r.filename, r.checksum]));

      for (const file of files) {
        const sql = fs.readFileSync(file.fullPath, 'utf8');
        const checksum = this.calculateChecksum(sql);

        if (executedMap.has(file.filename)) {
          const recordedChecksum = executedMap.get(file.filename);
          if (recordedChecksum !== checksum) {
            throw new Error(
              `Integrity Violation: Migration "${file.filename}" was previously executed with checksum ${recordedChecksum}, but file now has checksum ${checksum}. Modifying historical migrations is strictly forbidden!`
            );
          }
          continue;
        }

        // Execute in an isolated transaction
        const startTime = Date.now();
        logger.info(`Applying migration: ${file.filename}...`);

        await client.query('BEGIN');
        try {
          await client.query(sql);
          const duration = Date.now() - startTime;

          await client.query(
            'INSERT INTO schema_migrations (filename, checksum, execution_time_ms) VALUES ($1, $2, $3)',
            [file.filename, checksum, duration]
          );

          await client.query('COMMIT');
          appliedFiles.push(file.filename);
          logger.info(`Successfully applied migration: ${file.filename} (${duration}ms)`);
        } catch (err: any) {
          await client.query('ROLLBACK');
          logger.error(`Failed to apply migration: ${file.filename}`, err);
          throw new Error(`Migration Failed at ${file.filename}: ${err.message}`);
        }
      }

      return {
        success: true,
        totalFound: files.length,
        appliedCount: appliedFiles.length,
        skippedCount: files.length - appliedFiles.length,
        appliedFiles,
      };
    } finally {
      // Release Advisory Lock
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_ID]);
        logger.info('Released PostgreSQL migration advisory lock.');
      } catch (err) {
        logger.error('Failed to release advisory lock', err);
      }
      client.release();
    }
  }

  private async isPostgresAvailable(): Promise<boolean> {
    try {
      const pool = getPgPool();
      const client = await pool.connect();
      client.release();
      return true;
    } catch {
      return false;
    }
  }
}
