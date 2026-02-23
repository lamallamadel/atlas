-- Complete schema alignment and ensure constraints
-- This migration handles:
-- 1. Add meta_json to annonce table
-- 2. Update partie_prenante table structure to match entity definitions
-- 3. Ensure all org_id columns have NOT NULL constraints

-- Add meta_json column to annonce
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS meta_json ${json_type};

-- Update partie_prenante table structure
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS address VARCHAR(500);

ALTER TABLE partie_prenante DROP COLUMN IF EXISTS type;
ALTER TABLE partie_prenante DROP COLUMN IF EXISTS name;

-- Ensure NOT NULL constraints on org_id columns
ALTER TABLE annonce ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE dossier ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE partie_prenante ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE consentement ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE message ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE appointment ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE audit_event ALTER COLUMN org_id SET NOT NULL;

-- Make role NOT NULL in a portable way (H2-safe)
UPDATE partie_prenante
SET role = 'BUYER'
WHERE role IS NULL;

ALTER TABLE partie_prenante ALTER COLUMN role SET NOT NULL;


