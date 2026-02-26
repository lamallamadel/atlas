-- Create consentement_event table for immutable audit trail
CREATE TABLE consentement_event (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    consentement_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    metadata ${json_type},
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    CONSTRAINT fk_consentement_event_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE,
    CONSTRAINT fk_consentement_event_consentement FOREIGN KEY (consentement_id) REFERENCES consentement(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX idx_consentement_event_org_id ON consentement_event(org_id);
CREATE INDEX idx_consentement_event_dossier_id ON consentement_event(dossier_id);
CREATE INDEX idx_consentement_event_consentement_id ON consentement_event(consentement_id);
CREATE INDEX idx_consentement_event_event_type ON consentement_event(event_type);
CREATE INDEX idx_consentement_event_created_at ON consentement_event(created_at);
CREATE INDEX idx_consentement_event_org_dossier ON consentement_event(org_id, dossier_id);
CREATE INDEX idx_consentement_event_org_created_at ON consentement_event(org_id, created_at);
