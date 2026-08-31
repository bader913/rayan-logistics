-- 009_create_asset_movements.sql
-- Asset Movements & Complete Historical Audit Trail

CREATE TABLE IF NOT EXISTS asset_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, 
    -- 'RECEIVED', 'ASSIGNED_TO_EMPLOYEE', 'RETURNED_TO_STOCK', 'TRANSFERRED_TO_LOCATION',
    -- 'SENT_TO_REPAIR', 'RETURNED_FROM_REPAIR', 'REPORTED_DAMAGED', 'REPORTED_LOST',
    -- 'FOUND', 'DONATED', 'DISPOSED', 'CORRECTION'
    from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    from_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    to_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    movement_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    notes TEXT,
    performed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
