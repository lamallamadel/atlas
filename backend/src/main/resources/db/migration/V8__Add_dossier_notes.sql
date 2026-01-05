-- Add notes column to dossier table
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create full-text search indexes for PostgreSQL fallback
CREATE INDEX IF NOT EXISTS idx_annonce_title_fts ON annonce USING gin(to_tsvector('simple', COALESCE(title, '')));
CREATE INDEX IF NOT EXISTS idx_annonce_description_fts ON annonce USING gin(to_tsvector('simple', COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_annonce_address_fts ON annonce USING gin(to_tsvector('simple', COALESCE(address, '')));

CREATE INDEX IF NOT EXISTS idx_dossier_lead_name_fts ON dossier USING gin(to_tsvector('simple', COALESCE(lead_name, '')));
CREATE INDEX IF NOT EXISTS idx_dossier_notes_fts ON dossier USING gin(to_tsvector('simple', COALESCE(notes, '')));
