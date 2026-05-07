-- Add new verified_pro column to organization_settings
ALTER TABLE organization_settings ADD COLUMN verified_pro BOOLEAN NOT NULL DEFAULT FALSE;
