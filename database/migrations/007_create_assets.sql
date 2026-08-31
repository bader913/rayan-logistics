-- 007_create_assets.sql
-- Core Assets table with soft delete and normalized asset tracking

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_number VARCHAR(100),
    full_asset_number VARCHAR(150),
    normalized_asset_number VARCHAR(150),
    item_description TEXT NOT NULL,
    asset_type VARCHAR(50) NOT NULL DEFAULT 'EQUIPMENT', -- 'EQUIPMENT', 'FURNITURE', 'VEHICLE', 'IT', 'COMMUNICATION', 'OTHER'
    category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES asset_subcategories(id) ON DELETE SET NULL,
    brand_name VARCHAR(150),
    model VARCHAR(150),
    serial_number_1 VARCHAR(150),
    serial_number_2 VARCHAR(150),
    accessories TEXT,
    invoice_cost_syp NUMERIC(15, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    invoice_cost_usd NUMERIC(15, 2),
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
    gl_account VARCHAR(100),
    lin VARCHAR(100),
    office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    payment_voucher_number VARCHAR(100),
    pr_number VARCHAR(100),
    po_number VARCHAR(100),
    grn_number VARCHAR(100),
    date_received DATE,
    registered_by VARCHAR(150),
    lifecycle_status VARCHAR(50) NOT NULL DEFAULT 'CURRENTLY_HELD', -- 'CURRENTLY_HELD', 'DISPOSED', 'MISSING', 'TRANSFERRED', 'UNKNOWN'
    condition_status VARCHAR(50) NOT NULL DEFAULT 'OK', -- 'OK', 'DAMAGED', 'NEEDS_REPAIR', 'UNSERVICEABLE', 'LOST', 'UNKNOWN'
    current_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    current_custodian_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    notes TEXT,
    source_row_number INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Partial unique index on full_asset_number when present and not deleted
CREATE UNIQUE INDEX IF NOT EXISTS uq_assets_full_asset_number 
ON assets (full_asset_number) 
WHERE full_asset_number IS NOT NULL AND deleted_at IS NULL;

-- Index for normalized search
CREATE INDEX IF NOT EXISTS idx_assets_normalized_number 
ON assets (normalized_asset_number) 
WHERE deleted_at IS NULL;
