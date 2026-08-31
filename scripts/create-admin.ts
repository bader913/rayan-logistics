// scripts/create-admin.ts
import bcrypt from 'bcryptjs';
import { ENV } from '../server/config/env.js';
import { dbQuery } from '../server/db/pool.js';
import { logger } from '../server/utils/logger.js';

async function createAdmin() {
  console.log('====================================================');
  console.log('  Rayan Logistics - Admin Account Provisioning');
  console.log('====================================================');

  const username = (process.env.ADMIN_USERNAME || ENV.ADMIN_USERNAME || 'admin').trim();
  const email = (process.env.ADMIN_EMAIL || ENV.ADMIN_EMAIL || 'admin@rayanlogistics.org').trim();
  const password = process.env.ADMIN_PASSWORD || ENV.ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    console.error('❌ Error: ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  console.log(`Creating/Updating admin account: "${username}" <${email}>`);

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Look for ADMIN role
    const roleRes = await dbQuery('SELECT id FROM roles WHERE code = $1', ['ADMIN']);
    const roleId = roleRes.rows[0]?.id || 1;

    // Check if user exists
    const existing = await dbQuery('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);

    if (existing.rows.length > 0) {
      await dbQuery(
        `UPDATE users SET password_hash = $1, email = $2, role_id = $3, is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
        [passwordHash, email, roleId, existing.rows[0].id]
      );
      console.log(`✅ Admin user "${username}" credentials successfully updated.`);
    } else {
      await dbQuery(
        `INSERT INTO users (username, email, password_hash, role_id, is_active) VALUES ($1, $2, $3, $4, TRUE)`,
        [username, email, passwordHash, roleId]
      );
      console.log(`✅ Admin user "${username}" successfully created.`);
    }

    console.log('\nDefault credentials configured:');
    console.log(`Username: ${username}`);
    console.log(`Email:    ${email}`);
    console.log(`Password: [CONFIGURED IN ENVIRONMENT]\n`);
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Failed to provision admin user:', err.message);
    process.exit(1);
  }
}

createAdmin();
