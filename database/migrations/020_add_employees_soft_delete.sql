-- 020_add_employees_soft_delete.sql
-- Add soft-delete support required by employee and dashboard queries.

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_employees_active_records
    ON employees (is_active, full_name)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employees_active_number
    ON employees (employee_number)
    WHERE deleted_at IS NULL
      AND employee_number IS NOT NULL;
