-- Create referential_version table for audit trail
CREATE TABLE referential_version (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    referential_id BIGINT NOT NULL,
    category VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER,
    is_active BOOLEAN NOT NULL,
    is_system BOOLEAN NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create indexes for referential_version
CREATE INDEX idx_ref_version_ref_id ON referential_version(referential_id);
CREATE INDEX idx_ref_version_org_id ON referential_version(org_id);
CREATE INDEX idx_ref_version_created_at ON referential_version(created_at);
CREATE INDEX idx_ref_version_category ON referential_version(category);

-- Add change tracking columns to referential table
ALTER TABLE referential ADD COLUMN version BIGINT DEFAULT 1;
ALTER TABLE referential ADD COLUMN last_change_type VARCHAR(50);


