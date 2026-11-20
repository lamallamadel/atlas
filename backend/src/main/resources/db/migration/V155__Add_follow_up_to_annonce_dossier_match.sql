-- Relance d'une proposition de bien : client sans réponse de l'agent depuis 24 h, ou client
-- silencieux depuis 3 jours. Le rappel est en cours tant que follow_up_done_at est antérieur à
-- follow_up_notified_at.
ALTER TABLE annonce_dossier_match ADD COLUMN follow_up_kind VARCHAR(30);
ALTER TABLE annonce_dossier_match ADD COLUMN follow_up_notified_at TIMESTAMP;
ALTER TABLE annonce_dossier_match ADD COLUMN follow_up_done_at TIMESTAMP;
CREATE INDEX idx_adm_reply_at ON annonce_dossier_match (reply_at);
