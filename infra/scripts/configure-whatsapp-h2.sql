-- Configuration WhatsApp en local (base H2 de docker-compose.local.yml).
-- Console H2 : http://localhost:8083
--   JDBC URL : jdbc:h2:tcp://localhost:1521/atlas   Utilisateur : sa   Mot de passe : (vide)
-- Remplacer les valeurs entre <> puis exécuter.
--   <ACCESS_TOKEN>    : jeton d'accès Meta (temporaire 24 h)
--   <APP_SECRET>      : Meta > Paramètres de l'app > Général > Clé secrète
--   <PHONE_NUMBER_ID> : WhatsApp > Configuration de l'API > ID du numéro de téléphone (15 chiffres)
--   <WABA_ID>         : ID du compte WhatsApp Business (16 chiffres)
-- Organisation des données de démonstration : ORG-001 (SELECT DISTINCT org_id FROM annonce;)

MERGE INTO whatsapp_provider_config
    (org_id, api_key_encrypted, api_secret_encrypted, webhook_secret_encrypted,
     phone_number_id, business_account_id, enabled, created_at, updated_at)
KEY (org_id)
VALUES
    ('ORG-001', '<ACCESS_TOKEN>', '<APP_SECRET>', '<APP_SECRET>',
     '<PHONE_NUMBER_ID>', '<WABA_ID>', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Après votre premier message « Bonjour » au numéro de test, votre dossier existe :
SELECT id, lead_name, lead_phone, org_id FROM dossier ORDER BY id DESC LIMIT 5;

-- TEST UNIQUEMENT : accord marketing WhatsApp pour ce dossier (remplacer <DOSSIER_ID>)
INSERT INTO consentement
    (org_id, dossier_id, channel, consent_type, status, meta_json, created_at, updated_at)
VALUES
    ('ORG-001', <DOSSIER_ID>, 'WHATSAPP', 'MARKETING', 'GRANTED',
     '{"optInTimestamp":"2026-11-20T00:00:00Z","ipAddress":"test-manuel","doubleOptInConfirmed":true,"source":"test"}' FORMAT JSON,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Jeton expiré (erreur 190) : le remplacer
-- UPDATE whatsapp_provider_config SET api_key_encrypted = '<ACCESS_TOKEN>' WHERE org_id = 'ORG-001';
