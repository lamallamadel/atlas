-- Lien de confirmation du consentement envoyé au client (double opt-in).
-- Seule l'empreinte SHA-256 du jeton est conservée ; le lien sert une seule fois.
CREATE TABLE consent_request (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    answered_at TIMESTAMP,
    decision VARCHAR(20),
    consentement_id BIGINT,
    created_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX uk_consent_request_token ON consent_request (token_hash);
CREATE INDEX idx_consent_request_dossier ON consent_request (dossier_id);
