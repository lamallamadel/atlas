-- ADR 0004, phase A : case_type + status_code deviennent la référence du statut de dossier.
-- 1) Tout dossier a un type ; les valeurs inconnues envoyées par la vitrine ('DEMO', 'INFO')
--    n'ont jamais pu être enregistrées, mais on les ramène par sécurité.
UPDATE dossier
SET case_type = 'CRM_LEAD_B2B_DEMO'
WHERE case_type = 'DEMO';

UPDATE dossier
SET case_type = 'CRM_LEAD'
WHERE case_type IS NULL OR case_type = '' OR case_type = 'INFO';

-- 2) status_code passe des noms de l'enum aux codes de la nomenclature.
UPDATE dossier
SET status_code = CASE status
    WHEN 'NEW' THEN 'CRM_NEW'
    WHEN 'QUALIFYING' THEN 'CRM_QUALIFYING'
    WHEN 'QUALIFIED' THEN 'CRM_QUALIFIED'
    WHEN 'APPOINTMENT' THEN 'CRM_VISIT_PLANNED'
    WHEN 'WON' THEN 'CRM_CLOSED_WON'
    WHEN 'LOST' THEN 'CRM_CLOSED_LOST'
    ELSE status_code
END
WHERE status_code IS NULL
   OR status_code = ''
   OR status_code IN ('NEW', 'QUALIFYING', 'QUALIFIED', 'APPOINTMENT', 'WON', 'LOST');
