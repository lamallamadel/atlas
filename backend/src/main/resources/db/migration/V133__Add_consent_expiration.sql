-- Add expires_at column to consentement table for consent expiration tracking
-- NULL means no expiration (used for TRANSACTIONNEL consent type)
-- Non-NULL means the consent expires at the given timestamp (used for MARKETING consent type)
ALTER TABLE consentement ADD COLUMN expires_at TIMESTAMP DEFAULT NULL;

-- Standard index (H2 and PostgreSQL). Partial index for PostgreSQL is in migration-postgres.
CREATE INDEX idx_consentement_status_expires_at ON consentement(status, expires_at);
