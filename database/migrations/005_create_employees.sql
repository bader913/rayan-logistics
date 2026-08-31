-- 005_create_employees.sql
-- Employees table

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(100) UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    job_title VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(100),
    employment_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint to users table for employee_id
ALTER TABLE users 
ADD CONSTRAINT fk_users_employee 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;
