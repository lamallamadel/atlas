-- Add expires_at column to consentement table for consent expiration tracking
-- NULL means no expiration (used for TRANSACTIONNEL consent type)
-- Non-NULL means the consent expires at the given timestamp (used for MARKETING consent type)
ALTER TABLE consentement ADD COLUMN expires_at TIMESTAMP DEFAULT NULL;

-- Add index for efficient expiration queries
CREATE INDEX idx_consentement_status_expires_at ON consentement(status, expires_at) WHERE expires_at IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN consentement.expires_at IS 'Expiration timestamp for consent. NULL means no expiration (transactional). Non-NULL triggers expiration workflow (marketing).';
