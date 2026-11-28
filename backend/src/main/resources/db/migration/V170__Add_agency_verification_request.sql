-- Chemin de vérification des agences (bourse aux mandats) : l'agence dépose son registre de
-- commerce et son ICE, l'équipe Atlas valide ou refuse avec un motif. « verified » reste la
-- seule source de vérité de l'accès ; verification_status suit la demande (PENDING, REJECTED).
ALTER TABLE organization ADD COLUMN verification_status VARCHAR(16);
ALTER TABLE organization ADD COLUMN verification_rc VARCHAR(64);
ALTER TABLE organization ADD COLUMN verification_ice VARCHAR(32);
ALTER TABLE organization ADD COLUMN verification_contact VARCHAR(255);
ALTER TABLE organization ADD COLUMN verification_requested_at TIMESTAMP;
ALTER TABLE organization ADD COLUMN verification_note VARCHAR(500);
CREATE INDEX idx_organization_verification_status ON organization (verification_status);
