-- Add versioning fields to whatsapp_template table
ALTER TABLE whatsapp_template ADD COLUMN current_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE whatsapp_template ADD COLUMN meta_submission_id VARCHAR(255);

-- Create whatsapp_template_version table
CREATE TABLE whatsapp_template_version (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    template_id BIGINT NOT NULL,
    version_number INTEGER NOT NULL,
    components ${json_type},
    variables_snapshot ${json_type},
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    change_summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_template_version_template FOREIGN KEY (template_id) REFERENCES whatsapp_template(id) ON DELETE CASCADE,
    CONSTRAINT uq_template_version UNIQUE (template_id, version_number)
);

-- Create indexes for whatsapp_template_version
CREATE INDEX idx_template_version_org_id ON whatsapp_template_version(org_id);
CREATE INDEX idx_template_version_template_id ON whatsapp_template_version(template_id);
-- Note: partial index idx_template_version_active moved to migration-postgres (H2 doesn't support partial indexes)
CREATE INDEX idx_template_version_number ON whatsapp_template_version(template_id, version_number);

-- Create indexes for Meta submission tracking
-- Note: partial index idx_whatsapp_template_meta_submission moved to migration-postgres (H2 doesn't support partial indexes)
CREATE INDEX idx_whatsapp_template_current_version ON whatsapp_template(current_version);
