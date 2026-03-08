-- Replace standard index with partial index for efficient expiration queries (PostgreSQL-only).
-- Only indexes rows with expires_at set to reduce index size and speed up expiration workflows.
DROP INDEX IF EXISTS idx_consentement_status_expires_at;
CREATE INDEX idx_consentement_status_expires_at ON consentement(status, expires_at) WHERE expires_at IS NOT NULL;
