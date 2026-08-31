-- 008_create_asset_assignments.sql
-- Asset Custody and Employee Assignments

CREATE TABLE IF NOT EXISTS asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    assigned_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_return_date DATE,
    returned_at TIMESTAMPTZ,
    assigned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    returned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignment_condition VARCHAR(50) NOT NULL DEFAULT 'OK',
    return_condition VARCHAR(50),
    assignment_notes TEXT,
    return_notes TEXT,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CRITICAL: Prevent more than one active/current custody assignment for the same asset
CREATE UNIQUE INDEX IF NOT EXISTS uq_asset_single_current_assignment 
ON asset_assignments (asset_id) 
WHERE is_current = TRUE;
