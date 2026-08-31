-- 011_create_inventory_items.sql
-- Scanned & Verified Inventory Items within a Session

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    scanned_asset_number VARCHAR(150),
    expected_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    actual_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    expected_custodian_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    actual_custodian_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    result_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    -- 'PENDING', 'MATCHED', 'FOUND_DIFFERENT_LOCATION', 'FOUND_DIFFERENT_CUSTODIAN', 
    -- 'DAMAGED', 'NEEDS_REPAIR', 'MISSING', 'UNREGISTERED'
    condition_status VARCHAR(50),
    scanned_at TIMESTAMPTZ,
    scanned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique index per session and asset when asset_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS uq_session_asset 
ON inventory_items (inventory_session_id, asset_id) 
WHERE asset_id IS NOT NULL;
