// server/db/seed-data.ts
// Production-safe seed definition.
// Demo employees, users, assets, locations, inventory and maintenance
// records were intentionally removed.

export const initialSeedData = {
  roles: [
    {
      id: 1,
      code: 'ADMIN',
      name: 'System Administrator',
      description: 'Full system access and security administration',
    },
    {
      id: 2,
      code: 'OPERATIONS_MANAGER',
      name: 'Operations Manager',
      description: 'Operational oversight, approvals and inventory control',
    },
    {
      id: 3,
      code: 'LOGISTICS_OFFICER',
      name: 'Logistics Officer',
      description: 'Asset issuance, return, custody and transfer management',
    },
    {
      id: 4,
      code: 'WAREHOUSE_OFFICER',
      name: 'Warehouse Officer',
      description: 'Warehouse inventory and physical asset handling',
    },
    {
      id: 5,
      code: 'AUDITOR',
      name: 'Auditor',
      description: 'Read-only access to audit and inventory records',
    },
    {
      id: 6,
      code: 'VIEWER',
      name: 'Viewer',
      description: 'Basic read-only access',
    },
  ],
  offices: [],
  departments: [],
  locations: [],
  employees: [],
  users: [],
  donors: [],
  cost_centers: [],
  asset_categories: [],
  asset_subcategories: [],
  assets: [],
  asset_assignments: [],
  asset_movements: [],
  inventory_sessions: [],
  inventory_items: [],
  maintenance_requests: [],
  asset_disposals: [],
  asset_documents: [],
  audit_logs: [],
};
