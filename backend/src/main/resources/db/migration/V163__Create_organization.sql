-- Cas d'usage n°1 (ADR 0005) : registre des organisations. Jusqu'ici une organisation n'existait
-- que comme chaîne org_id. Une organisation de type OWNER est l'organisation personnelle d'un
-- propriétaire (un seul membre) ; les org_id existants sont repris comme agences.
-- La table « organization » existe déjà (V110, squelette id + version pour la réplication) :
-- on la complète.
ALTER TABLE organization ADD COLUMN org_id VARCHAR(255);
ALTER TABLE organization ADD COLUMN org_type VARCHAR(16) DEFAULT 'AGENCY' NOT NULL;
ALTER TABLE organization ADD COLUMN display_name VARCHAR(255);
ALTER TABLE organization ADD COLUMN verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE organization ADD COLUMN owner_user_id VARCHAR(255);
ALTER TABLE organization ADD COLUMN owner_phone VARCHAR(32);
ALTER TABLE organization ADD COLUMN terms_version VARCHAR(32);
ALTER TABLE organization ADD COLUMN terms_accepted_at TIMESTAMP;
ALTER TABLE organization ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE organization ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE organization ADD CONSTRAINT uk_organization_org_id UNIQUE (org_id);
ALTER TABLE organization ADD CONSTRAINT uk_organization_owner_phone UNIQUE (owner_phone);
CREATE INDEX idx_organization_type ON organization (org_type);

INSERT INTO organization (org_id, org_type, display_name, verified, created_at, updated_at)
SELECT DISTINCT src.org_id, 'AGENCY', src.org_id, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT org_id FROM annonce
    UNION SELECT org_id FROM dossier
    UNION SELECT org_id FROM organization_settings
) src
WHERE src.org_id IS NOT NULL;
