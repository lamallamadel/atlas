-- Add locale column to dossier table
ALTER TABLE dossier 
ADD COLUMN IF NOT EXISTS locale VARCHAR(10);

-- Set default locale based on existing data
-- Default to French for all existing records
UPDATE dossier 
SET locale = 'fr_FR' 
WHERE locale IS NULL;

-- Add index for locale-based queries
CREATE INDEX IF NOT EXISTS idx_dossier_locale 
ON dossier(locale);

COMMENT ON COLUMN dossier.locale IS 'Locale for communication (fr_FR, en_US, ar_MA) - defaults from phone country code';
