-- 012_create_maintenance.sql
-- Asset Maintenance and Repair Work Orders

CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(100) NOT NULL UNIQUE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    reported_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    issue_description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_REPAIR', 'RESOLVED', 'CANCELLED', 'UNREPAIRABLE'
    sent_to VARCHAR(150),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    estimated_cost NUMERIC(15, 2),
    actual_cost NUMERIC(15, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
