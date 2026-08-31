-- 016_create_import_batches.sql
-- Excel Batch Import Logging and Row Issue Tracing

CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_file_name VARCHAR(255) NOT NULL,
    import_type VARCHAR(50) NOT NULL DEFAULT 'EXCEL_ASSETS_EMP', -- 'EXCEL_ASSETS_EMP', 'EXCEL_ASSETS', 'EXCEL_EMPLOYEES'
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PREVIEW_ONLY'
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_rows INTEGER NOT NULL DEFAULT 0,
    warning_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    imported_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    sheet_name VARCHAR(100),
    row_number INTEGER NOT NULL,
    field_name VARCHAR(100),
    issue_type VARCHAR(50) NOT NULL, -- 'WARNING', 'ERROR', 'NORMALIZED', 'UNMATCHED_EMPLOYEE'
    issue_message TEXT NOT NULL,
    original_value TEXT,
    resolution_status VARCHAR(50) NOT NULL DEFAULT 'LOGGED', -- 'LOGGED', 'RESOLVED', 'IGNORED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
