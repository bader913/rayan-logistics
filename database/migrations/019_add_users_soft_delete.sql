-- 019_add_users_soft_delete.sql
-- Add soft-delete support to system users.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_active_login
    ON users (LOWER(username))
    WHERE deleted_at IS NULL AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_users_active_email
    ON users (LOWER(email))
    WHERE deleted_at IS NULL
      AND is_active = TRUE
      AND email IS NOT NULL;