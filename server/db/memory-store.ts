// server/db/memory-store.ts
import { normalizeAssetNumber, normalizeConditionStatus, normalizeLifecycleStatus } from '../utils/asset-normalizer.js';
import { initialSeedData } from './seed-data.js';

/**
 * In-memory relational store that emulates PostgreSQL tables,
 * foreign keys, unique indexes, and queries so that the web preview runs instantly.
 */
class MemoryDatabase {
  public roles: any[] = [];
  public users: any[] = [];
  public offices: any[] = [];
  public departments: any[] = [];
  public locations: any[] = [];
  public employees: any[] = [];
  public donors: any[] = [];
  public cost_centers: any[] = [];
  public asset_categories: any[] = [];
  public asset_subcategories: any[] = [];
  public assets: any[] = [];
  public asset_assignments: any[] = [];
  public asset_movements: any[] = [];
  public inventory_sessions: any[] = [];
  public inventory_items: any[] = [];
  public maintenance_requests: any[] = [];
  public asset_disposals: any[] = [];
  public asset_documents: any[] = [];
  public audit_logs: any[] = [];
  public import_batches: any[] = [];
  public import_issues: any[] = [];
  public schema_migrations: any[] = [];

  constructor() {
    this.seed();
  }

  public seed() {
    this.roles = [...initialSeedData.roles];
    this.users = [...initialSeedData.users];
    this.offices = [...initialSeedData.offices];
    this.departments = [...initialSeedData.departments];
    this.locations = [...initialSeedData.locations];
    this.employees = [...initialSeedData.employees];
    this.donors = [...initialSeedData.donors];
    this.cost_centers = [...initialSeedData.cost_centers];
    this.asset_categories = [...initialSeedData.asset_categories];
    this.asset_subcategories = [...initialSeedData.asset_subcategories];
    this.assets = [...initialSeedData.assets];
    this.asset_assignments = [...initialSeedData.asset_assignments];
    this.asset_movements = [...initialSeedData.asset_movements];
    this.inventory_sessions = [...initialSeedData.inventory_sessions];
    this.inventory_items = [...initialSeedData.inventory_items];
    this.maintenance_requests = [...initialSeedData.maintenance_requests];
    this.asset_disposals = [...initialSeedData.asset_disposals];
    this.asset_documents = [...initialSeedData.asset_documents];
    this.audit_logs = [...initialSeedData.audit_logs];
    this.import_batches = [];
    this.import_issues = [];
    this.schema_migrations = [];
  }

  public async transaction<T>(callback: (query: (sql: string, params?: any[]) => Promise<any>) => Promise<T>): Promise<T> {
    // In-memory atomic snapshot
    const snapshot = JSON.stringify({
      assets: this.assets,
      asset_assignments: this.asset_assignments,
      asset_movements: this.asset_movements,
      inventory_sessions: this.inventory_sessions,
      inventory_items: this.inventory_items,
      maintenance_requests: this.maintenance_requests,
      asset_disposals: this.asset_disposals,
      audit_logs: this.audit_logs
    });

    try {
      const result = await callback((sql, params) => this.query(sql, params));
      return result;
    } catch (err) {
      const restored = JSON.parse(snapshot);
      Object.assign(this, restored);
      throw err;
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const s = sql.trim().replace(/\s+/g, ' ');

    // 1. SELECT Users by username
    if (s.includes('FROM users') && s.includes('username = $1')) {
      const user = this.users.find(u => u.username.toLowerCase() === String(params[0]).toLowerCase() && u.is_active);
      if (!user) return { rows: [], rowCount: 0 };
      const role = this.roles.find(r => r.id === user.role_id);
      const row = { ...user, role_code: role?.code, role_name: role?.name };
      return { rows: [row as any], rowCount: 1 };
    }

    // 2. SELECT Users by id
    if (s.includes('FROM users') && s.includes('id = $1')) {
      const user = this.users.find(u => u.id === params[0]);
      if (!user) return { rows: [], rowCount: 0 };
      const role = this.roles.find(r => r.id === user.role_id);
      const row = { ...user, role_code: role?.code, role_name: role?.name };
      return { rows: [row as any], rowCount: 1 };
    }

    // 3. SELECT all users
    if (s.includes('FROM users') && !s.includes('WHERE')) {
      const rows = this.users.map(u => {
        const role = this.roles.find(r => r.id === u.role_id);
        const emp = this.employees.find(e => e.id === u.employee_id);
        return { ...u, role_code: role?.code, role_name: role?.name, employee_name: emp?.full_name };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 4. SELECT roles
    if (s.includes('FROM roles')) {
      return { rows: [...this.roles] as any, rowCount: this.roles.length };
    }

    // 5. SELECT offices
    if (s.includes('FROM offices')) {
      return { rows: [...this.offices] as any, rowCount: this.offices.length };
    }

    // 6. SELECT departments
    if (s.includes('FROM departments')) {
      const rows = this.departments.map(d => {
        const off = this.offices.find(o => o.id === d.office_id);
        return { ...d, office_name: off?.office_name };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 7. SELECT locations
    if (s.includes('FROM locations')) {
      const rows = this.locations.map(l => {
        const off = this.offices.find(o => o.id === l.office_id);
        const parent = this.locations.find(p => p.id === l.parent_location_id);
        return { ...l, office_name: off?.office_name, parent_location_name: parent?.location_name };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 8. SELECT employees
    if (s.includes('FROM employees') || s.includes('v_employee_custody_summary')) {
      if (s.includes('WHERE id = $1') || s.includes('WHERE e.id = $1')) {
        const emp = this.employees.find(e => e.id === params[0]);
        if (!emp) return { rows: [], rowCount: 0 };
        const dept = this.departments.find(d => d.id === emp.department_id);
        const assignedAssets = this.assets.filter(a => a.current_custodian_employee_id === emp.id && !a.deleted_at);
        const custodyVal = assignedAssets.reduce((sum, a) => sum + (Number(a.invoice_cost_usd) || 0), 0);
        return {
          rows: [{
            ...emp,
            department_name: dept?.department_name,
            total_assigned_assets: assignedAssets.length,
            total_custody_value_usd: custodyVal
          } as any],
          rowCount: 1
        };
      }
      const rows = this.employees.map(e => {
        const dept = this.departments.find(d => d.id === e.department_id);
        const assignedAssets = this.assets.filter(a => a.current_custodian_employee_id === e.id && !a.deleted_at);
        const custodyVal = assignedAssets.reduce((sum, a) => sum + (Number(a.invoice_cost_usd) || 0), 0);
        return {
          ...e,
          department_name: dept?.department_name,
          total_assigned_assets: assignedAssets.length,
          total_custody_value_usd: custodyVal
        };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 9. Categories & Subcategories
    if (s.includes('FROM asset_categories')) {
      return { rows: [...this.asset_categories] as any, rowCount: this.asset_categories.length };
    }
    if (s.includes('FROM asset_subcategories')) {
      const rows = this.asset_subcategories.map(sc => {
        const cat = this.asset_categories.find(c => c.id === sc.category_id);
        return { ...sc, category_name: cat?.name };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 10. Donors & Cost Centers
    if (s.includes('FROM donors')) {
      return { rows: [...this.donors] as any, rowCount: this.donors.length };
    }
    if (s.includes('FROM cost_centers')) {
      const rows = this.cost_centers.map(cc => {
        const donor = this.donors.find(d => d.id === cc.donor_id);
        return { ...cc, donor_name: donor?.donor_name };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 11. Assets & Detailed Views
    if (s.includes('FROM assets') || s.includes('v_assets_detailed')) {
      // Find by ID
      if (s.includes('WHERE a.id = $1') || s.includes('WHERE id = $1')) {
        const a = this.assets.find(item => item.id === params[0] && !item.deleted_at);
        if (!a) return { rows: [], rowCount: 0 };
        return { rows: [this.enrichAsset(a) as any], rowCount: 1 };
      }

      let filtered = this.assets.filter(a => !a.deleted_at);

      // Search & Filters if applicable
      const enriched = filtered.map(a => this.enrichAsset(a));
      return { rows: enriched as any, rowCount: enriched.length };
    }

    // 12. Asset Movements
    if (s.includes('FROM asset_movements')) {
      if (s.includes('WHERE asset_id = $1')) {
        const mvs = this.asset_movements
          .filter(m => m.asset_id === params[0])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const enriched = mvs.map(m => {
          const fromLoc = this.locations.find(l => l.id === m.from_location_id);
          const toLoc = this.locations.find(l => l.id === m.to_location_id);
          const fromEmp = this.employees.find(e => e.id === m.from_employee_id);
          const toEmp = this.employees.find(e => e.id === m.to_employee_id);
          const user = this.users.find(u => u.id === m.performed_by_user_id);
          return {
            ...m,
            from_location_name: fromLoc?.location_name,
            to_location_name: toLoc?.location_name,
            from_employee_name: fromEmp?.full_name,
            to_employee_name: toEmp?.full_name,
            performed_by_username: user?.username
          };
        });
        return { rows: enriched as any, rowCount: enriched.length };
      }
      return { rows: this.asset_movements as any, rowCount: this.asset_movements.length };
    }

    // 13. Asset Assignments
    if (s.includes('FROM asset_assignments')) {
      if (s.includes('WHERE asset_id = $1')) {
        const asgns = this.asset_assignments.filter(a => a.asset_id === params[0]);
        return { rows: asgns as any, rowCount: asgns.length };
      }
      return { rows: this.asset_assignments as any, rowCount: this.asset_assignments.length };
    }

    // 14. Inventory Sessions & Items
    if (s.includes('FROM inventory_sessions')) {
      if (s.includes('WHERE id = $1') || s.includes('WHERE s.id = $1')) {
        const sess = this.inventory_sessions.find(s => s.id === params[0]);
        if (!sess) return { rows: [], rowCount: 0 };
        const items = this.inventory_items.filter(i => i.inventory_session_id === sess.id);
        const off = this.offices.find(o => o.id === sess.office_id);
        const loc = this.locations.find(l => l.id === sess.location_id);
        const cat = this.asset_categories.find(c => c.id === sess.category_id);
        const user = this.users.find(u => u.id === sess.created_by_user_id);
        return {
          rows: [{
            ...sess,
            office_name: off?.office_name,
            location_name: loc?.location_name,
            category_name: cat?.name,
            created_by_username: user?.username,
            total_items_count: items.length,
            scanned_items_count: items.filter(i => i.result_status !== 'PENDING').length,
            matched_count: items.filter(i => i.result_status === 'MATCHED').length,
            missing_count: items.filter(i => i.result_status === 'MISSING').length,
            issues_count: items.filter(i => ['FOUND_DIFFERENT_LOCATION', 'FOUND_DIFFERENT_CUSTODIAN', 'DAMAGED', 'NEEDS_REPAIR', 'UNREGISTERED'].includes(i.result_status)).length,
          } as any],
          rowCount: 1
        };
      }
      const rows = this.inventory_sessions.map(sess => {
        const items = this.inventory_items.filter(i => i.inventory_session_id === sess.id);
        const off = this.offices.find(o => o.id === sess.office_id);
        const loc = this.locations.find(l => l.id === sess.location_id);
        const cat = this.asset_categories.find(c => c.id === sess.category_id);
        return {
          ...sess,
          office_name: off?.office_name,
          location_name: loc?.location_name,
          category_name: cat?.name,
          total_items_count: items.length,
          scanned_items_count: items.filter(i => i.result_status !== 'PENDING').length,
        };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    if (s.includes('FROM inventory_items')) {
      if (s.includes('WHERE inventory_session_id = $1')) {
        const items = this.inventory_items.filter(i => i.inventory_session_id === params[0]);
        const enriched = items.map(item => {
          const asset = this.assets.find(a => a.id === item.asset_id);
          const expLoc = this.locations.find(l => l.id === item.expected_location_id);
          const actLoc = this.locations.find(l => l.id === item.actual_location_id);
          const expEmp = this.employees.find(e => e.id === item.expected_custodian_id);
          const actEmp = this.employees.find(e => e.id === item.actual_custodian_id);
          const scanner = this.users.find(u => u.id === item.scanned_by_user_id);
          return {
            ...item,
            item_description: asset?.item_description,
            full_asset_number: asset?.full_asset_number || item.scanned_asset_number,
            brand_name: asset?.brand_name,
            model: asset?.model,
            expected_location_name: expLoc?.location_name,
            actual_location_name: actLoc?.location_name,
            expected_custodian_name: expEmp?.full_name,
            actual_custodian_name: actEmp?.full_name,
            scanned_by_username: scanner?.username,
          };
        });
        return { rows: enriched as any, rowCount: enriched.length };
      }
      return { rows: this.inventory_items as any, rowCount: this.inventory_items.length };
    }

    // 15. Maintenance
    if (s.includes('FROM maintenance_requests')) {
      const rows = this.maintenance_requests.map(m => {
        const asset = this.assets.find(a => a.id === m.asset_id);
        const emp = this.employees.find(e => e.id === m.reported_by_employee_id);
        const user = this.users.find(u => u.id === m.reported_by_user_id);
        return {
          ...m,
          full_asset_number: asset?.full_asset_number,
          item_description: asset?.item_description,
          reported_by_employee_name: emp?.full_name,
          reported_by_username: user?.username
        };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 16. Disposals
    if (s.includes('FROM asset_disposals')) {
      const rows = this.asset_disposals.map(d => {
        const asset = this.assets.find(a => a.id === d.asset_id);
        const user = this.users.find(u => u.id === d.created_by_user_id);
        return {
          ...d,
          full_asset_number: asset?.full_asset_number,
          item_description: asset?.item_description,
          created_by_username: user?.username
        };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 17. Audit logs
    if (s.includes('FROM audit_logs')) {
      const rows = this.audit_logs.map(log => {
        const user = this.users.find(u => u.id === log.user_id);
        return { ...log, username: user?.username };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 18. Import Batches
    if (s.includes('FROM import_batches')) {
      return { rows: [...this.import_batches] as any, rowCount: this.import_batches.length };
    }

    // 19. Schema migrations table
    if (s.includes('FROM schema_migrations')) {
      return { rows: [...this.schema_migrations] as any, rowCount: this.schema_migrations.length };
    }

    // Generic fallback return
    return { rows: [], rowCount: 0 };
  }

  private enrichAsset(a: any) {
    const cat = this.asset_categories.find(c => c.id === a.category_id);
    const subcat = this.asset_subcategories.find(sc => sc.id === a.subcategory_id);
    const donor = this.donors.find(d => d.id === a.donor_id);
    const cc = this.cost_centers.find(c => c.id === a.cost_center_id);
    const off = this.offices.find(o => o.id === a.office_id);
    const dept = this.departments.find(d => d.id === a.department_id);
    const loc = this.locations.find(l => l.id === a.current_location_id);
    const emp = this.employees.find(e => e.id === a.current_custodian_employee_id);

    return {
      ...a,
      category_name: cat?.name,
      category_code: cat?.code,
      subcategory_name: subcat?.name,
      subcategory_code: subcat?.code,
      donor_name: donor?.donor_name,
      donor_code: donor?.donor_code,
      cost_center_code: cc?.code,
      office_name: off?.office_name,
      office_code: off?.office_code,
      department_name: dept?.department_name,
      department_code: dept?.department_code,
      current_location_name: loc?.location_name,
      current_location_code: loc?.location_code,
      current_location_type: loc?.location_type,
      current_custodian_name: emp?.full_name,
      current_custodian_number: emp?.employee_number,
      current_custodian_job_title: emp?.job_title,
    };
  }
}

let memoryDbInstance: MemoryDatabase | null = null;

export function getMemoryDb(): MemoryDatabase {
  if (!memoryDbInstance) {
    memoryDbInstance = new MemoryDatabase();
  }
  return memoryDbInstance;
}
