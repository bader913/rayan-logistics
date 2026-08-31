// scripts/seed.ts
import {
  dbTransaction,
  checkDbConnection,
} from '../server/db/pool.js';
import { initialSeedData } from '../server/db/seed-data.js';

async function seed() {
  console.log('====================================================');
  console.log('  Rayan Logistics - Production Safe Seeder');
  console.log('====================================================');

  const health = await checkDbConnection();

  console.log(
    `Target Engine: ${health.engine} (Connected: ${health.connected})`
  );

  if (!health.connected || health.engine !== 'PostgreSQL') {
    console.error(
      'Seeding requires an active PostgreSQL connection.'
    );
    process.exit(1);
  }

  try {
    await dbTransaction(async (query) => {
      for (const role of initialSeedData.roles) {
        await query(
          `INSERT INTO roles (id, code, name, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code)
           DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description`,
          [
            role.id,
            role.code,
            role.name,
            role.description,
          ]
        );
      }
    });

    console.log('System roles verified successfully.');
    console.log('No demonstration data was inserted.');
    process.exit(0);
  } catch (error) {
    console.error('Safe seeding failed:', error);
    process.exit(1);
  }
}

seed();
