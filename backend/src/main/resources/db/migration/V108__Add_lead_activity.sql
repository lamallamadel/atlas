-- V41: Add lead_activity table for tracking dossier/lead interactions

CREATE TABLE IF NOT EXISTS lead_activity (
    id           BIGSERIAL PRIMARY KEY,
    dossier_id   BIGINT       NOT NULL REFERENCES dossier(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description  TEXT,
    score_impact  INTEGER,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_dossier_id ON lead_activity(dossier_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_created_at ON lead_activity(created_at DESC);
