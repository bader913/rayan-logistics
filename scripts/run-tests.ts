// scripts/run-tests.ts
import { normalizeAssetNumber, normalizeConditionStatus, normalizeLifecycleStatus } from '../server/utils/asset-normalizer.js';
import { parseExcelDate } from '../server/utils/excel-date.js';
import { MigrationRunner } from '../server/db/migrate-runner.js';
import { dbQuery, checkDbConnection } from '../server/db/pool.js';

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('  Rayan Logistics - Automated Test Suite');
  console.log('====================================================\n');

  // Test 1: Asset Number Normalization
  console.log('[Suite 1: Asset Normalizer]');
  assert('Normalizes Syrian asset format with slashes', normalizeAssetNumber('SYR/DAM/001') === 'SYR/DAM/001');
  assert('Normalizes hyphens to slashes', normalizeAssetNumber('SYR-DAM-001') === 'SYR/DAM/001');
  assert('Normalizes backslashes and spaces', normalizeAssetNumber('SYR \\ DAM \\ 0042') === 'SYR/DAM/0042');
  assert('Trims external whitespace', normalizeAssetNumber('  SYR/DAM/042  ') === 'SYR/DAM/042');
  assert('Handles uppercase standardization', normalizeAssetNumber('syr/dam/001') === 'SYR/DAM/001');

  // Test 2: Lifecycle & Condition Normalization
  console.log('\n[Suite 2: Status & Condition Normalizer]');
  assert('Normalizes Good/OK condition', normalizeConditionStatus('Good condition') === 'OK');
  assert('Normalizes Damaged condition', normalizeConditionStatus('Damaged') === 'DAMAGED');
  assert('Normalizes Needs repair', normalizeConditionStatus('Needs maintenance') === 'NEEDS_REPAIR');
  assert('Normalizes Lifecycle active', normalizeLifecycleStatus('Currently in use') === 'CURRENTLY_HELD');
  assert('Normalizes Lifecycle disposed', normalizeLifecycleStatus('Scrapped and disposed') === 'DISPOSED');

  // Test 3: Excel Date Parsing
  console.log('\n[Suite 3: Excel Date Parser]');
  assert('Parses serial Excel date (44927 -> 2023-01-01)', parseExcelDate(44927) === '2023-01-01');
  assert('Parses ISO date string', parseExcelDate('2024-05-15') === '2024-05-15');
  assert('Parses slash formatted date DD/MM/YYYY', parseExcelDate('25/12/2023') === '2023-12-25');

  // Test 4: Migration Runner Integrity
  console.log('\n[Suite 4: Migration Engine]');
  const runner = new MigrationRunner();
  const files = runner.getMigrationFiles();
  assert(`Found ${files.length} SQL migration files`, files.length === 18);
  assert('First migration is 001_enable_extensions.sql', files[0].filename === '001_enable_extensions.sql');
  assert('Last migration is 018_create_views.sql', files[files.length - 1].filename === '018_create_views.sql');

  const status = await runner.getStatus();
  assert(`Status returns ${status.length} records`, status.length === 18);

  // Test 5: Database Connection and Integrity
  console.log('\n[Suite 5: Database Engine]');
  const dbHealth = await checkDbConnection();
  assert(`Database engine initialized (${dbHealth.engine})`, !!dbHealth.engine);

  const rolesRes = await dbQuery('SELECT * FROM roles');
  assert('Roles table queryable', rolesRes.rows.length >= 4);

  const assetsRes = await dbQuery('SELECT * FROM assets');
  assert('Assets table queryable', assetsRes.rows.length >= 4);

  // Summary
  console.log('\n====================================================');
  console.log(`Test Execution Complete: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
