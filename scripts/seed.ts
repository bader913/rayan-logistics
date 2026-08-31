// scripts/seed.ts
import { dbQuery, dbTransaction, checkDbConnection } from '../server/db/pool.js';
import { initialSeedData } from '../server/db/seed-data.js';
import { logger } from '../server/utils/logger.js';

async function seed() {
  console.log('====================================================');
  console.log('  Rayan Logistics - Database Seeder');
  console.log('====================================================');

  const health = await checkDbConnection();
  console.log(`Target Engine: ${health.engine} (Connected: ${health.connected})`);

  try {
    await dbTransaction(async (query) => {
      // 1. Roles
      for (const r of initialSeedData.roles) {
        await query(
          `INSERT INTO roles (id, code, name, description) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING`,
          [r.id, r.code, r.name, r.description]
        );
      }

      // 2. Offices
      for (const o of initialSeedData.offices) {
        await query(
          `INSERT INTO offices (id, country, office_code, office_name, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (office_code) DO NOTHING`,
          [o.id, o.country, o.office_code, o.office_name, o.is_active]
        );
      }

      // 3. Departments
      for (const d of initialSeedData.departments) {
        await query(
          `INSERT INTO departments (id, department_code, department_name, office_id, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (department_code) DO NOTHING`,
          [d.id, d.department_code, d.department_name, d.office_id, d.is_active]
        );
      }

      // 4. Locations
      for (const l of initialSeedData.locations) {
        await query(
          `INSERT INTO locations (id, office_id, parent_location_id, location_code, location_name, location_type, description, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [l.id, l.office_id, l.parent_location_id, l.location_code, l.location_name, l.location_type, l.description, l.is_active]
        );
      }

      // 5. Employees
      for (const e of initialSeedData.employees) {
        await query(
          `INSERT INTO employees (id, employee_number, full_name, department_id, job_title, email, phone, employment_status, is_active, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (employee_number) DO NOTHING`,
          [e.id, e.employee_number, e.full_name, e.department_id, e.job_title, e.email, e.phone, e.employment_status, e.is_active, e.notes]
        );
      }

      // 6. Users
      for (const u of initialSeedData.users) {
        await query(
          `INSERT INTO users (id, employee_id, username, email, password_hash, role_id, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (username) DO NOTHING`,
          [u.id, u.employee_id, u.username, u.email, u.password_hash, u.role_id, u.is_active]
        );
      }

      // 7. Donors & Cost Centers
      for (const d of initialSeedData.donors) {
        await query(
          `INSERT INTO donors (id, donor_code, donor_name, is_active) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [d.id, d.donor_code, d.donor_name, d.is_active]
        );
      }
      for (const cc of initialSeedData.cost_centers) {
        await query(
          `INSERT INTO cost_centers (id, code, name, donor_id, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING`,
          [cc.id, cc.code, cc.name, cc.donor_id, cc.is_active]
        );
      }

      // 8. Categories & Subcategories
      for (const c of initialSeedData.asset_categories) {
        await query(
          `INSERT INTO asset_categories (id, code, name, description, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING`,
          [c.id, c.code, c.name, c.description, c.is_active]
        );
      }
      for (const sc of initialSeedData.asset_subcategories) {
        await query(
          `INSERT INTO asset_subcategories (id, category_id, code, name, description, is_active) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
          [sc.id, sc.category_id, sc.code, sc.name, sc.description, sc.is_active]
        );
      }

      // 9. Assets
      for (const a of initialSeedData.assets) {
        await query(
          `INSERT INTO assets (
            id, asset_number, full_asset_number, normalized_asset_number, item_description, asset_type,
            category_id, subcategory_id, brand_name, model, serial_number_1, serial_number_2, accessories,
            invoice_cost_syp, currency, invoice_cost_usd, donor_id, cost_center_id, gl_account, lin,
            office_id, department_id, payment_voucher_number, pr_number, po_number, grn_number,
            date_received, registered_by, lifecycle_status, condition_status, current_location_id,
            current_custodian_employee_id, notes, source_row_number
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
          ) ON CONFLICT DO NOTHING`,
          [
            a.id, a.asset_number, a.full_asset_number, a.normalized_asset_number, a.item_description, a.asset_type,
            a.category_id, a.subcategory_id, a.brand_name, a.model, a.serial_number_1, a.serial_number_2, a.accessories,
            a.invoice_cost_syp, a.currency, a.invoice_cost_usd, a.donor_id, a.cost_center_id, a.gl_account, a.lin,
            a.office_id, a.department_id, a.payment_voucher_number, a.pr_number, a.po_number, a.grn_number,
            a.date_received, a.registered_by, a.lifecycle_status, a.condition_status, a.current_location_id,
            a.current_custodian_employee_id, a.notes, a.source_row_number
          ]
        );
      }

      // 10. Assignments
      for (const asgn of initialSeedData.asset_assignments) {
        await query(
          `INSERT INTO asset_assignments (id, asset_id, employee_id, assigned_location_id, assignment_date, expected_return_date, returned_at, assigned_by_user_id, assignment_condition, assignment_notes, is_current)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING`,
          [asgn.id, asgn.asset_id, asgn.employee_id, asgn.assigned_location_id, asgn.assignment_date, asgn.expected_return_date, asgn.returned_at, asgn.assigned_by_user_id, asgn.assignment_condition, asgn.assignment_notes, asgn.is_current]
        );
      }

      // 11. Movements
      for (const m of initialSeedData.asset_movements) {
        await query(
          `INSERT INTO asset_movements (id, asset_id, movement_type, from_location_id, to_location_id, from_employee_id, to_employee_id, movement_date, reference_number, notes, performed_by_user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING`,
          [m.id, m.asset_id, m.movement_type, m.from_location_id, m.to_location_id, m.from_employee_id, m.to_employee_id, m.movement_date, m.reference_number, m.notes, m.performed_by_user_id]
        );
      }

      // 12. Inventory Sessions & Items
      for (const s of initialSeedData.inventory_sessions) {
        await query(
          `INSERT INTO inventory_sessions (id, session_number, session_name, office_id, location_id, category_id, status, started_at, created_by_user_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (session_number) DO NOTHING`,
          [s.id, s.session_number, s.session_name, s.office_id, s.location_id, s.category_id, s.status, s.started_at, s.created_by_user_id, s.notes]
        );
      }
      for (const itm of initialSeedData.inventory_items) {
        await query(
          `INSERT INTO inventory_items (id, inventory_session_id, asset_id, scanned_asset_number, expected_location_id, actual_location_id, expected_custodian_id, actual_custodian_id, result_status, condition_status, scanned_at, scanned_by_user_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT DO NOTHING`,
          [itm.id, itm.inventory_session_id, itm.asset_id, itm.scanned_asset_number, itm.expected_location_id, itm.actual_location_id, itm.expected_custodian_id, itm.actual_custodian_id, itm.result_status, itm.condition_status, itm.scanned_at, itm.scanned_by_user_id, itm.notes]
        );
      }

      // 13. Maintenance
      for (const mr of initialSeedData.maintenance_requests) {
        await query(
          `INSERT INTO maintenance_requests (id, request_number, asset_id, reported_by_employee_id, reported_by_user_id, issue_description, priority, status, sent_to, opened_at, estimated_cost, currency, resolution_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (request_number) DO NOTHING`,
          [mr.id, mr.request_number, mr.asset_id, mr.reported_by_employee_id, mr.reported_by_user_id, mr.issue_description, mr.priority, mr.status, mr.sent_to, mr.opened_at, mr.estimated_cost, mr.currency, mr.resolution_notes]
        );
      }
    });

    console.log('✅ Seed Data successfully populated!');
    console.log('  - Offices: 1');
    console.log('  - Locations: 3');
    console.log('  - Departments: 3');
    console.log('  - Employees: 5');
    console.log('  - Categories: 4 (8 Subcategories)');
    console.log('  - Assets: 10');
    console.log('  - Active Inventory Sessions: 1 (3 items)');
    console.log('  - Maintenance Requests: 1');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
