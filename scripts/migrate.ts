// scripts/migrate.ts
import { MigrationRunner } from '../server/db/migrate-runner.js';
import { logger } from '../server/utils/logger.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'up';
  const runner = new MigrationRunner();

  console.log('====================================================');
  console.log('  Rayan Logistics - PostgreSQL Migration Engine');
  console.log('====================================================');

  if (command === 'status') {
    const status = await runner.getStatus();
    console.log('\nMigration Status Report:');
    console.table(
      status.map((s) => ({
        Migration: s.filename,
        Status: s.applied ? 'APPLIED' : 'PENDING',
        Checksum: s.checksum.substring(0, 12) + '...',
        ExecutedAt: s.executedAt || '-',
        TimeMs: s.executionTimeMs !== undefined ? `${s.executionTimeMs}ms` : '-',
      }))
    );
    const applied = status.filter((s) => s.applied).length;
    const pending = status.filter((s) => !s.applied).length;
    console.log(`\nSummary: ${applied} applied, ${pending} pending (Total: ${status.length})\n`);
    process.exit(0);
  }

  if (command === 'up') {
    try {
      const result = await runner.run();
      console.log(`\nMigration Run Completed:`);
      console.log(`- Total files found: ${result.totalFound}`);
      console.log(`- Applied migrations: ${result.appliedCount}`);
      console.log(`- Skipped (already applied): ${result.skippedCount}`);
      if (result.appliedFiles.length > 0) {
        console.log(`- Applied files:\n  ${result.appliedFiles.join('\n  ')}`);
      }
      console.log('\nDatabase is up to date!\n');
      process.exit(0);
    } catch (err: any) {
      console.error('\n❌ Migration Failed:', err.message);
      process.exit(1);
    }
  }

  console.error(`Unknown command: ${command}. Use "up" or "status".`);
  process.exit(1);
}

main().catch((err) => {
  logger.error('Migration command error', err);
  process.exit(1);
});
