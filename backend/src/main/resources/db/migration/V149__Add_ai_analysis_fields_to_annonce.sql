-- Résultats d'analyse IA du brain conservés séparément :
--  - fraud_alertes : liste des alertes renvoyées par /api/fraud/analyser
--  - duplicate_*   : doublon le plus proche trouvé par /api/dupli/verifier
-- Avant cette migration, un doublon écrasait fraud_statut / fraud_score.
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS fraud_alertes ${json_type};
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS duplicate_of_id BIGINT;
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS duplicate_similarity DOUBLE PRECISION;
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS duplicate_statut VARCHAR(20);
