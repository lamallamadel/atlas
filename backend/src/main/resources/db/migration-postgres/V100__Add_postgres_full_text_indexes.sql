-- PostgreSQL-only: Full-text search (GIN) indexes

CREATE INDEX IF NOT EXISTS idx_annonce_title_fts
  ON annonce USING gin (to_tsvector('simple', COALESCE(title, '')));

CREATE INDEX IF NOT EXISTS idx_annonce_description_fts
  ON annonce USING gin (to_tsvector('simple', COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_annonce_address_fts
  ON annonce USING gin (to_tsvector('simple', COALESCE(address, '')));

CREATE INDEX IF NOT EXISTS idx_dossier_lead_name_fts
  ON dossier USING gin (to_tsvector('simple', COALESCE(lead_name, '')));

CREATE INDEX IF NOT EXISTS idx_dossier_notes_fts
  ON dossier USING gin (to_tsvector('simple', COALESCE(notes, '')));

ALTER TABLE annonce
  ALTER COLUMN surface TYPE double precision
  USING surface::double precision;
