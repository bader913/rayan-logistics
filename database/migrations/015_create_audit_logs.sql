-- 015_create_audit_logs.sql
-- Security & Operational Audit Log Trail

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'LOGIN', 'CREATE_ASSET', 'UPDATE_ASSET', 'DELETE_ASSET', 'ASSIGN_ASSET', 'RETURN_ASSET', 'TRANSFER_ASSET', etc.
    entity_type VARCHAR(100) NOT NULL, -- 'ASSET', 'EMPLOYEE', 'USER', 'INVENTORY', 'MAINTENANCE', 'DISPOSAL', 'IMPORT'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
