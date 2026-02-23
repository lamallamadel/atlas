-- Migration to convert existing DossierStatus enum values to referential codes
-- This ensures backward compatibility while moving to a referential-based status system

-- Step 1: Update existing dossiers to populate statusCode from the enum status field
-- If statusCode is already set, keep it; otherwise, derive from status enum
UPDATE dossier
SET status_code = COALESCE(status_code, status::VARCHAR)
WHERE status_code IS NULL OR status_code = '';

-- Step 2: Ensure all case types have referential entries
-- If organizations are using custom case types, they should be added to CASE_TYPE referential

-- Step 3: Add database constraint to ensure statusCode references valid CASE_STATUS codes
-- Note: This is a soft constraint via application logic rather than a foreign key
-- to allow flexibility for multi-tenant referential systems

-- Step 4: Create index on statusCode for performance
CREATE INDEX IF NOT EXISTS idx_dossier_status_code ON dossier(status_code);

-- Step 5: Create index on combined case_type and status_code for filtering
CREATE INDEX IF NOT EXISTS idx_dossier_case_type_status_code ON dossier(case_type, status_code);

-- Step 6: Add migration metadata comment
COMMENT ON COLUMN dossier.status_code IS 'References CASE_STATUS referential code. Replaces enum-based status for flexible status management.';
COMMENT ON COLUMN dossier.case_type IS 'References CASE_TYPE referential code. Determines which workflow and status codes are applicable.';

