-- Create referential table
CREATE TABLE referential (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uq_referential_org_category_code UNIQUE (org_id, category, code)
);

-- Create indexes
CREATE INDEX idx_referential_org_id ON referential(org_id);
CREATE INDEX idx_referential_category ON referential(category);
CREATE INDEX idx_referential_code ON referential(code);
CREATE INDEX idx_referential_is_active ON referential(is_active);

-- Add new columns to dossier table
ALTER TABLE dossier ADD COLUMN case_type VARCHAR(100);
ALTER TABLE dossier ADD COLUMN status_code VARCHAR(100);
ALTER TABLE dossier ADD COLUMN loss_reason VARCHAR(100);
ALTER TABLE dossier ADD COLUMN won_reason VARCHAR(100);

-- Migrate existing status values to status_code
UPDATE dossier SET status_code = status WHERE status_code IS NULL;

-- Set default case_type for existing dossiers
UPDATE dossier SET case_type = 'CRM_LEAD_BUY' WHERE case_type IS NULL;

-- Add index on new columns
CREATE INDEX idx_dossier_case_type ON dossier(case_type);
CREATE INDEX idx_dossier_status_code ON dossier(status_code);
