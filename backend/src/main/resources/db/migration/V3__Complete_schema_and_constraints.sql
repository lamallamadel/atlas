-- Complete schema alignment and ensure constraints
-- This migration handles:
-- 1. Add meta_json to annonce table
-- 2. Update partie_prenante table structure to match entity definitions
-- 3. Ensure all org_id columns have NOT NULL constraints (idempotent)

-- Add meta_json column to annonce
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS meta_json JSONB;

-- Update partie_prenante table structure
-- Original V1 had: type, name, phone, email
-- Entity expects: role, first_name, last_name, email, phone, address

-- Add new columns if they don't exist
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS address VARCHAR(500);

-- Drop old columns if they still exist (after data migration if needed)
-- Note: In fresh installs, these columns won't exist
ALTER TABLE partie_prenante DROP COLUMN IF EXISTS type;
ALTER TABLE partie_prenante DROP COLUMN IF EXISTS name;

-- Ensure NOT NULL constraints on org_id columns (idempotent - V1 already has these)
-- These ALTER statements are safe to run even if constraint already exists
ALTER TABLE annonce ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE dossier ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE partie_prenante ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE consentement ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE message ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE appointment ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE audit_event ALTER COLUMN org_id SET NOT NULL;

-- Update role column to NOT NULL if it has data
-- (This is conditional since existing data might not have been migrated yet)
-- For fresh installs, this ensures the constraint is properly set
DO $$
BEGIN
    -- Only set NOT NULL if all existing rows have a role value
    IF NOT EXISTS (SELECT 1 FROM partie_prenante WHERE role IS NULL) THEN
        ALTER TABLE partie_prenante ALTER COLUMN role SET NOT NULL;
    END IF;
END $$;
