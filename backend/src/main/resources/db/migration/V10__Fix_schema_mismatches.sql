-- Fix schema mismatches between V1 and later migrations

-- 1. ALTER appointment.org_id from BIGINT to VARCHAR(255)
ALTER TABLE appointment ALTER COLUMN org_id TYPE VARCHAR(255);

-- 2. ADD channel VARCHAR(50) NOT NULL to message table with default 'EMAIL'
ALTER TABLE message ADD COLUMN channel VARCHAR(50) NOT NULL DEFAULT 'EMAIL';

-- 3. ADD channel VARCHAR(50) NOT NULL to consentement table with default 'SMS'
ALTER TABLE consentement ADD COLUMN channel VARCHAR(50) NOT NULL DEFAULT 'SMS';

-- 4. ADD dossier_id BIGINT to notification table
ALTER TABLE notification ADD COLUMN dossier_id BIGINT;
ALTER TABLE notification ADD CONSTRAINT fk_notification_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE;
CREATE INDEX idx_notification_dossier_id ON notification(dossier_id);

-- 5. ADD status VARCHAR(50) to consentement with default 'GRANTED'
ALTER TABLE consentement ADD COLUMN status VARCHAR(50) DEFAULT 'GRANTED';

-- 6. UPDATE existing data to ensure consistency
-- Update consentement status based on granted field
UPDATE consentement SET status = CASE 
    WHEN granted = true AND revoked_at IS NULL THEN 'GRANTED'
    WHEN granted = true AND revoked_at IS NOT NULL THEN 'REVOKED'
    ELSE 'PENDING'
END WHERE status IS NULL;

-- Make status NOT NULL after setting defaults
ALTER TABLE consentement ALTER COLUMN status SET NOT NULL;
