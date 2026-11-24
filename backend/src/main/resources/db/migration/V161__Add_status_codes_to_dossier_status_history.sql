-- ADR 0004, phase B : l'historique des statuts mémorise les codes de la nomenclature.
-- L'enum (from_status, to_status) reste écrit pendant la transition, comme projection.
ALTER TABLE dossier_status_history ADD COLUMN from_code VARCHAR(50);
ALTER TABLE dossier_status_history ADD COLUMN to_code VARCHAR(50);

UPDATE dossier_status_history
SET from_code = CASE from_status
    WHEN 'NEW' THEN 'CRM_NEW'
    WHEN 'QUALIFYING' THEN 'CRM_QUALIFYING'
    WHEN 'QUALIFIED' THEN 'CRM_QUALIFIED'
    WHEN 'APPOINTMENT' THEN 'CRM_VISIT_PLANNED'
    WHEN 'WON' THEN 'CRM_CLOSED_WON'
    WHEN 'LOST' THEN 'CRM_CLOSED_LOST'
    ELSE NULL
END,
to_code = CASE to_status
    WHEN 'NEW' THEN 'CRM_NEW'
    WHEN 'QUALIFYING' THEN 'CRM_QUALIFYING'
    WHEN 'QUALIFIED' THEN 'CRM_QUALIFIED'
    WHEN 'APPOINTMENT' THEN 'CRM_VISIT_PLANNED'
    WHEN 'WON' THEN 'CRM_CLOSED_WON'
    WHEN 'LOST' THEN 'CRM_CLOSED_LOST'
    ELSE NULL
END;

CREATE INDEX idx_dossier_status_history_to_code ON dossier_status_history(to_code);
