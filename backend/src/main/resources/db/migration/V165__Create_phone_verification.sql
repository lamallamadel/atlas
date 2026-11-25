-- Cas d'usage n°1, lot A : codes à usage unique envoyés au téléphone d'un propriétaire
-- (inscription). Le code n'est jamais stocké en clair.
CREATE TABLE phone_verification (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(32) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    channel VARCHAR(16),
    attempts INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    ip_address VARCHAR(64),
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_phone_verification_phone ON phone_verification (phone, purpose, created_at);
CREATE INDEX idx_phone_verification_ip ON phone_verification (ip_address, created_at);
