-- Configuration WhatsApp Cloud API d'une organisation (PostgreSQL).
-- Remplacer les 5 valeurs entre <> puis exécuter dans Adminer (db.afroware.app) ou psql.
-- Les colonnes *_encrypted contiennent les valeurs en clair (pas de chiffrement appliqué).
--
--   <ORG_ID>           : organisation Atlas (SELECT DISTINCT org_id FROM annonce;)
--   <ACCESS_TOKEN>     : jeton d'accès Meta (temporaire 24 h, ou utilisateur système)
--   <APP_SECRET>       : Meta > Paramètres de l'app > Général > Clé secrète (signature des webhooks)
--   <PHONE_NUMBER_ID>  : WhatsApp > Configuration de l'API > ID du numéro de téléphone (15 chiffres)
--   <WABA_ID>          : ID du compte WhatsApp Business (16 chiffres)

INSERT INTO whatsapp_provider_config
    (org_id, api_key_encrypted, api_secret_encrypted, webhook_secret_encrypted,
     phone_number_id, business_account_id, enabled, created_at, updated_at)
VALUES
    ('<ORG_ID>', '<ACCESS_TOKEN>', '<APP_SECRET>', '<APP_SECRET>',
     '<PHONE_NUMBER_ID>', '<WABA_ID>', TRUE, NOW(), NOW())
ON CONFLICT (org_id) DO UPDATE SET
    api_key_encrypted        = EXCLUDED.api_key_encrypted,
    api_secret_encrypted     = EXCLUDED.api_secret_encrypted,
    webhook_secret_encrypted = EXCLUDED.webhook_secret_encrypted,
    phone_number_id          = EXCLUDED.phone_number_id,
    business_account_id      = EXCLUDED.business_account_id,
    enabled                  = TRUE,
    updated_at               = NOW();

-- Pour renouveler seulement le jeton (le temporaire expire au bout de 24 h) :
-- UPDATE whatsapp_provider_config SET api_key_encrypted = '<ACCESS_TOKEN>', updated_at = NOW()
--  WHERE org_id = '<ORG_ID>';

-- ── TEST UNIQUEMENT : accord marketing WhatsApp pour un dossier de test ──────────────
-- L'onglet « Consentements » du dossier ne permet pas encore d'enregistrer un accord
-- marketing complet (type et métadonnées RGPD manquants). Pour tester avec VOTRE numéro :
--   <DOSSIER_ID> : SELECT id, lead_name, lead_phone FROM dossier WHERE lead_phone LIKE '%6XXXXXXXX%';
INSERT INTO consentement
    (org_id, dossier_id, channel, consent_type, status, granted, granted_at, meta_json, created_at, updated_at)
VALUES
    ('<ORG_ID>', <DOSSIER_ID>, 'WHATSAPP', 'MARKETING', 'GRANTED', TRUE, NOW(),
     '{"optInTimestamp": "2026-11-20T00:00:00Z", "ipAddress": "test-manuel", "doubleOptInConfirmed": true, "source": "test"}',
     NOW(), NOW());
