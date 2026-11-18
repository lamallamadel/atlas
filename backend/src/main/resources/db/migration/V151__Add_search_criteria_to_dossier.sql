-- Critères de recherche de l'acheteur / du locataire, utilisés par le matching
-- (budget, villes, type de transaction, catégories, surface, meublé, équipements, état accepté).
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS search_criteria ${json_type};
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS search_criteria_updated_at TIMESTAMP;
