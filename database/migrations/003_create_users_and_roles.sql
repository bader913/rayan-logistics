-- 003_create_users_and_roles.sql
-- Roles and Users tables

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert system default roles
INSERT INTO roles (code, name, description)
VALUES 
    ('ADMIN', 'System Administrator', 'Full system access and user management'),
    ('OPERATIONS_MANAGER', 'Operations Manager', 'Operational oversight, approvals and inventory control'),
    ('LOGISTICS_OFFICER', 'Logistics Officer', 'Asset issuance, return, custody, and transfer management'),
    ('WAREHOUSE_OFFICER', 'Warehouse Officer', 'Warehouse inventory and physical asset handling'),
    ('AUDITOR', 'Auditor', 'Read-only access to records, audit logs and inventory reports'),
    ('VIEWER', 'Viewer', 'Basic view permissions')
ON CONFLICT (code) DO NOTHING;
