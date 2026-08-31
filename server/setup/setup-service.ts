import { Client } from 'pg';
import {
  ServerDatabaseConfig,
} from './setup-config.js';

export interface ConnectionTestResult {
  success: boolean;
  serverVersion?: string;
  databaseExists?: boolean;
  message: string;
}

function createClientConfig(
  config: ServerDatabaseConfig,
  database: string
) {
  return {
    host: config.host,
    port: config.port,
    database,
    user: config.user,
    password: config.password,
    ssl: config.ssl
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 5000,
  };
}

export async function testPostgresConnection(
  config: ServerDatabaseConfig
): Promise<ConnectionTestResult> {
  const maintenanceDatabase =
    config.database.toLowerCase() === 'postgres'
      ? 'template1'
      : 'postgres';

  const client = new Client(
    createClientConfig(
      config,
      maintenanceDatabase
    )
  );

  try {
    await client.connect();

    const versionResult = await client.query<{
      server_version: string;
    }>(
      'SHOW server_version'
    );

    const databaseResult = await client.query<{
      exists: boolean;
    }>(
      `SELECT EXISTS(
         SELECT 1
         FROM pg_database
         WHERE datname = $1
       ) AS exists`,
      [config.database]
    );

    return {
      success: true,
      serverVersion:
        versionResult.rows[0]?.server_version,
      databaseExists:
        databaseResult.rows[0]?.exists === true,
      message:
        databaseResult.rows[0]?.exists === true
          ? 'تم الاتصال بنجاح وقاعدة البيانات موجودة.'
          : 'تم الاتصال بنجاح والنظام جاهز لإنشاء قاعدة البيانات.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: getFriendlyConnectionError(error),
    };
  } finally {
    await client.end().catch(() => {});
  }
}

export interface DatabaseCreationResult {
  created: boolean;
  message: string;
}

export async function ensureDatabaseExists(
  config: ServerDatabaseConfig
): Promise<DatabaseCreationResult> {
  const maintenanceDatabase =
    config.database.toLowerCase() === 'postgres'
      ? 'template1'
      : 'postgres';

  const client = new Client(
    createClientConfig(
      config,
      maintenanceDatabase
    )
  );

  try {
    await client.connect();

    const existingDatabase = await client.query<{
      exists: boolean;
    }>(
      `SELECT EXISTS(
         SELECT 1
         FROM pg_database
         WHERE datname = $1
       ) AS exists`,
      [config.database]
    );

    if (existingDatabase.rows[0]?.exists === true) {
      return {
        created: false,
        message: 'قاعدة البيانات موجودة وجاهزة.',
      };
    }

    const escapedDatabaseName =
      config.database.replace(/"/g, '""');

    await client.query(
      `CREATE DATABASE "${escapedDatabaseName}"
       WITH ENCODING 'UTF8'
       TEMPLATE template0`
    );

    return {
      created: true,
      message: 'تم إنشاء قاعدة البيانات بنجاح.',
    };
  } catch (error: any) {
    const friendlyError = getFriendlyConnectionError(
      error
    );

    throw new Error(friendlyError);
  } finally {
    await client.end().catch(() => {});
  }
}
function getFriendlyConnectionError(
  error: any
): string {
  switch (error?.code) {
    case 'ECONNREFUSED':
      return 'تعذر الوصول إلى خادم قاعدة البيانات. تأكد أن PostgreSQL يعمل وأن عنوان الخادم والمنفذ صحيحان.';

    case '28P01':
      return 'اسم مستخدم قاعدة البيانات أو كلمة المرور غير صحيحة.';

    case '28000':
      return 'فشل تسجيل الدخول إلى قاعدة البيانات. تحقق من معلومات المستخدم.';

    case '3D000':
      return 'قاعدة الاتصال الأساسية غير موجودة على الخادم.';

    case 'ETIMEDOUT':
      return 'انتهت مهلة الاتصال. تحقق من عنوان الخادم والشبكة.';

    case 'ENOTFOUND':
      return 'تعذر العثور على عنوان خادم قاعدة البيانات.';

    default:
      return 'تعذر الاتصال بقاعدة البيانات. تحقق من معلومات الاتصال وحاول مجددًا.';
  }
}