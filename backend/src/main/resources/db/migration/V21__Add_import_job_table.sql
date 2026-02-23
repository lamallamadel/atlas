-- Add import job table for tracking lead imports

CREATE TABLE import_job (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255),
    status_ VARCHAR(50) NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    error_report TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_import_job_org_id ON import_job(org_id);
CREATE INDEX idx_import_job_status ON import_job(status_);
CREATE INDEX idx_import_job_created_at ON import_job(created_at);



