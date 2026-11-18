-- Proposition du bien envoyée au client acheteur (WhatsApp ou SMS) après validation de l'agent.
ALTER TABLE annonce_dossier_match ADD COLUMN pitched_at TIMESTAMP;
ALTER TABLE annonce_dossier_match ADD COLUMN pitch_channel VARCHAR(20);
ALTER TABLE annonce_dossier_match ADD COLUMN pitch_message_id BIGINT;
