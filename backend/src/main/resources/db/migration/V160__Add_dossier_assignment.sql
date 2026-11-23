-- Étape 6, lot A : agent assigné à un dossier (identifiant Keycloak, le « sub » du jeton).
-- Sans agent, le dossier est « à attribuer ». Le nom est gardé au moment de l'assignation pour
-- l'affichage, sans dépendre de Keycloak.
ALTER TABLE dossier ADD COLUMN assigned_to VARCHAR(255);
ALTER TABLE dossier ADD COLUMN assigned_to_name VARCHAR(255);
ALTER TABLE dossier ADD COLUMN assigned_at TIMESTAMP;

-- Reprise : le dossier revient à l'utilisateur qui l'a créé. Les dossiers créés par le système
-- (portail, vitrine, WhatsApp, imports planifiés) restent à attribuer.
UPDATE dossier
SET assigned_to = created_by,
    assigned_at = created_at
WHERE created_by IS NOT NULL
  AND created_by <> ''
  AND created_by <> 'system'
  AND created_by <> 'anonymousUser';

CREATE INDEX idx_dossier_org_assigned_to ON dossier (org_id, assigned_to);
