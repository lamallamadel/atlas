-- Add JSONB columns to annonce
ALTER TABLE annonce ADD COLUMN photos_json JSONB;
ALTER TABLE annonce ADD COLUMN rules_json JSONB;

-- Add missing scalar columns to annonce
ALTER TABLE annonce ADD COLUMN type VARCHAR(100);
ALTER TABLE annonce ADD COLUMN address VARCHAR(500);
ALTER TABLE annonce ADD COLUMN surface DECIMAL(10, 2);

-- Add missing scalar columns to dossier
ALTER TABLE dossier ADD COLUMN score INTEGER;
ALTER TABLE dossier ADD COLUMN source VARCHAR(100);

-- Add JSONB column to partie_prenante
ALTER TABLE partie_prenante ADD COLUMN meta_json JSONB;

-- Add JSONB column to consentement
ALTER TABLE consentement ADD COLUMN meta_json JSONB;

-- Add JSONB column to audit_event
ALTER TABLE audit_event ADD COLUMN diff_json JSONB;

-- Add index on annonce.city
CREATE INDEX idx_annonce_city ON annonce(city);

-- Add composite index on message(dossier_id, created_at)
CREATE INDEX idx_message_dossier_created ON message(dossier_id, created_at);
