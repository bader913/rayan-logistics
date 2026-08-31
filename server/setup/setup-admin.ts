import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import {
  ServerDatabaseConfig,
} from './setup-config.js';

export interface InitialAdminInput {
  username: string;
  email: string;
  password: string;
}

export interface InitialAdminResult {
  id: string;
  username: string;
  email: string;
}

export async function createInitialAdministrator(
  databaseConfig: ServerDatabaseConfig,
  admin: InitialAdminInput
): Promise<InitialAdminResult> {
  const pool = new Pool({
    host: databaseConfig.host,
    port: databaseConfig.port,
    database: databaseConfig.database,
    user: databaseConfig.user,
    password: databaseConfig.password,
    ssl: databaseConfig.ssl
      ? { rejectUnauthorized: false }
      : false,
    max: 2,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingAdministrator =
      await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE r.code = 'ADMIN'
           AND u.is_active = TRUE
           AND u.deleted_at IS NULL`
      );

    if (
      Number(
        existingAdministrator.rows[0]?.count || 0
      ) > 0
    ) {
      throw new Error(
        'يوجد حساب مدير عام في النظام مسبقًا.'
      );
    }

    const roleResult = await client.query<{
      id: number;
    }>(
      `SELECT id
       FROM roles
       WHERE code = 'ADMIN'
       LIMIT 1`
    );

    const adminRoleId = roleResult.rows[0]?.id;

    if (!adminRoleId) {
      throw new Error(
        'تعذر العثور على صلاحية المدير العام.'
      );
    }

    const duplicateResult = await client.query(
      `SELECT id
       FROM users
       WHERE LOWER(username) = LOWER($1)
          OR LOWER(email) = LOWER($2)
       LIMIT 1`,
      [
        admin.username.trim(),
        admin.email.trim(),
      ]
    );

    if (duplicateResult.rows.length > 0) {
      throw new Error(
        'اسم المستخدم أو البريد الإلكتروني مستخدم مسبقًا.'
      );
    }

    const passwordHash = await bcrypt.hash(
      admin.password,
      12
    );

    const insertedResult =
      await client.query<InitialAdminResult>(
        `INSERT INTO users (
           username,
           email,
           password_hash,
           role_id,
           is_active
         )
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id, username, email`,
        [
          admin.username.trim(),
          admin.email.trim().toLowerCase(),
          passwordHash,
          adminRoleId,
        ]
      );

    await client.query('COMMIT');

    return insertedResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}