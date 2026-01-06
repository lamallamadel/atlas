-- Add notes column to dossier table
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS notes TEXT;
