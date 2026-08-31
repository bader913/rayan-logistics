import fs from 'node:fs';
import path from 'node:path';

export interface ServerDatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

export interface ServerSetupConfig {
  setupCompleted: boolean;
  database: ServerDatabaseConfig;
  completedAt: string | null;
}

const DATA_DIRECTORY = path.resolve(
  process.cwd(),
  'data'
);

const CONFIG_FILE = path.join(
  DATA_DIRECTORY,
  'server-config.json'
);

export function getSetupConfigPath(): string {
  return CONFIG_FILE;
}

export function hasSetupConfig(): boolean {
  return fs.existsSync(CONFIG_FILE);
}

export function readSetupConfig(): ServerSetupConfig | null {
  if (!hasSetupConfig()) {
    return null;
  }

  const rawContent = fs.readFileSync(
    CONFIG_FILE,
    'utf8'
  );

  const parsed = JSON.parse(
    rawContent
  ) as Partial<ServerSetupConfig>;

  if (
    parsed.setupCompleted !== true ||
    !parsed.database ||
    typeof parsed.database.host !== 'string' ||
    typeof parsed.database.port !== 'number' ||
    typeof parsed.database.database !== 'string' ||
    typeof parsed.database.user !== 'string' ||
    typeof parsed.database.password !== 'string' ||
    typeof parsed.database.ssl !== 'boolean'
  ) {
    throw new Error(
      'The local server setup configuration is invalid.'
    );
  }

  return parsed as ServerSetupConfig;
}

export function writeSetupConfig(
  config: ServerSetupConfig
): void {
  fs.mkdirSync(DATA_DIRECTORY, {
    recursive: true,
  });

  const temporaryFile = `${CONFIG_FILE}.tmp`;

  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(config, null, 2),
    {
      encoding: 'utf8',
      mode: 0o600,
    }
  );

  fs.renameSync(
    temporaryFile,
    CONFIG_FILE
  );
}

export function isSetupCompleted(): boolean {
  try {
    return readSetupConfig()?.setupCompleted === true;
  } catch {
    return false;
  }
}