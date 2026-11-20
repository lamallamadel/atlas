-- Réponse du client à la proposition du bien (intention, créneau de visite proposé à l'agent).
ALTER TABLE annonce_dossier_match ADD COLUMN reply_intent VARCHAR(30);
ALTER TABLE annonce_dossier_match ADD COLUMN reply_excerpt VARCHAR(500);
ALTER TABLE annonce_dossier_match ADD COLUMN reply_at TIMESTAMP;
ALTER TABLE annonce_dossier_match ADD COLUMN reply_message_id BIGINT;
ALTER TABLE annonce_dossier_match ADD COLUMN proposed_start TIMESTAMP;
ALTER TABLE annonce_dossier_match ADD COLUMN proposed_end TIMESTAMP;
ALTER TABLE annonce_dossier_match ADD COLUMN visit_appointment_id BIGINT;
CREATE INDEX idx_adm_dossier_pitched ON annonce_dossier_match (dossier_id, pitched_at);
