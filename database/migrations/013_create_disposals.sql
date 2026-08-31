-- 013_create_disposals.sql
-- Asset Disposals, Decommissioning and Scrap Records

CREATE TABLE IF NOT EXISTS asset_disposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    disposal_type VARCHAR(50) NOT NULL, -- 'DONATED', 'SOLD', 'SCRAPPED', 'LOST', 'OTHER'
    disposal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    disposal_reference VARCHAR(100),
    approved_by VARCHAR(150),
    recipient VARCHAR(200),
    reason TEXT,
    notes TEXT,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
