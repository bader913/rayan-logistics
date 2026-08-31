import {
  ServerDatabaseConfig,
  writeSetupConfig,
} from './setup-config.js';
import {
  ensureDatabaseExists,
  testPostgresConnection,
} from './setup-service.js';
import {
  runSetupMigrations,
} from './setup-migrations.js';
import {
  createInitialAdministrator,
  InitialAdminInput,
} from './setup-admin.js';

export interface InstallSystemInput {
  database: ServerDatabaseConfig;
  administrator: InitialAdminInput;
}

export interface InstallSystemResult {
  databaseCreated: boolean;
  migrationsApplied: number;
  migrationsSkipped: number;
  administrator: {
    id: string;
    username: string;
    email: string;
  };
}

let installationInProgress = false;

export function isInstallationInProgress(): boolean {
  return installationInProgress;
}

export async function installSystem(
  input: InstallSystemInput
): Promise<InstallSystemResult> {
  if (installationInProgress) {
    throw new Error(
      'عملية إعداد النظام قيد التنفيذ حاليًا.'
    );
  }

  installationInProgress = true;

  try {
    const connectionResult =
      await testPostgresConnection(input.database);

    if (!connectionResult.success) {
      throw new Error(connectionResult.message);
    }

    const databaseResult =
      await ensureDatabaseExists(input.database);

    const migrationResult =
      await runSetupMigrations(input.database);

    const administrator =
      await createInitialAdministrator(
        input.database,
        input.administrator
      );

    writeSetupConfig({
      setupCompleted: true,
      database: input.database,
      completedAt: new Date().toISOString(),
    });

    return {
      databaseCreated: databaseResult.created,
      migrationsApplied: migrationResult.applied,
      migrationsSkipped: migrationResult.skipped,
      administrator,
    };
  } finally {
    installationInProgress = false;
  }
}