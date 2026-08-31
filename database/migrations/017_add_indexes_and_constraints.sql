-- 017_add_indexes_and_constraints.sql
-- Optimized composite and lookup indexes

CREATE INDEX IF NOT EXISTS idx_assets_lifecycle_condition 
ON assets (lifecycle_status, condition_status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_assets_category_subcategory 
ON assets (category_id, subcategory_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_assets_location 
ON assets (current_location_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_assets_custodian 
ON assets (current_custodian_employee_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_assets_office_dept 
ON assets (office_id, department_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_assets_serial_numbers 
ON assets (serial_number_1, serial_number_2) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_asset_movements_asset_id 
ON asset_movements (asset_id, movement_date DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_items_session 
ON inventory_items (inventory_session_id, result_status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_asset 
ON maintenance_requests (asset_id, status);
