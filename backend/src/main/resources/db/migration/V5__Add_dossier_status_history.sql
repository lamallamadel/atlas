-- Add QUALIFYING status to the existing dossier status check constraint
ALTER TABLE dossier DROP CONSTRAINT IF EXISTS chk_dossier_status;
ALTER TABLE dossier ADD CONSTRAINT chk_dossier_status
    CHECK (status IN ('NEW', 'QUALIFYING', 'QUALIFIED', 'APPOINTMENT', 'WON', 'LOST'));

-- Create dossier_status_history table
CREATE TABLE dossier_status_history (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    reason TEXT,
    transitioned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dossier_status_history_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE,
    CONSTRAINT chk_from_status CHECK (from_status IN ('DRAFT','NEW', 'QUALIFYING', 'QUALIFIED', 'APPOINTMENT', 'WON', 'LOST')),
    CONSTRAINT chk_to_status CHECK (to_status IN ('NEW', 'QUALIFYING', 'QUALIFIED', 'APPOINTMENT', 'WON', 'LOST'))
);

-- Create indexes for dossier_status_history table
CREATE INDEX idx_dossier_status_history_org_id ON dossier_status_history(org_id);
CREATE INDEX idx_dossier_status_history_dossier_id ON dossier_status_history(dossier_id);
CREATE INDEX idx_dossier_status_history_transitioned_at ON dossier_status_history(transitioned_at);
CREATE INDEX idx_dossier_status_history_user_id ON dossier_status_history(user_id);


