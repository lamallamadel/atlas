-- Étape 5 du backlog : signalements d'annonces depuis le portail public, traités par l'agence.
-- Écrit sans contexte d'organisation (visiteur anonyme) : l'agence est celle de l'annonce.
CREATE TABLE annonce_report (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    annonce_id BIGINT NOT NULL,
    reason_code VARCHAR(40) NOT NULL,
    comment VARCHAR(1000),
    reporter_email VARCHAR(255),
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    resolution VARCHAR(40),
    resolution_comment VARCHAR(1000),
    closed_by VARCHAR(255),
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_annonce_report_org_status ON annonce_report (org_id, status);
CREATE INDEX idx_annonce_report_annonce ON annonce_report (annonce_id);
