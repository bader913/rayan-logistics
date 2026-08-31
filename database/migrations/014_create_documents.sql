-- 014_create_documents.sql
-- Asset Attachments and Documents (Invoices, handover receipts, photos)

CREATE TABLE IF NOT EXISTS asset_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'INVOICE', 'HANDOVER_FORM', 'PHOTO', 'WARRANTY', 'MAINTENANCE_REPORT', 'DISPOSAL_ACT', 'OTHER'
    document_name VARCHAR(200) NOT NULL,
    file_path VARCHAR(500),
    external_url VARCHAR(500),
    uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
