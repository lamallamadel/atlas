-- Lead Scoring Configuration Table
CREATE TABLE lead_scoring_config (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    config_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_qualification_threshold INTEGER DEFAULT 70,
    source_weights ${json_type},
    engagement_weights ${json_type},
    property_match_weights ${json_type},
    response_time_weight INTEGER DEFAULT 20,
    fast_response_minutes INTEGER DEFAULT 60,
    medium_response_minutes INTEGER DEFAULT 240,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_lead_scoring_config_org_id ON lead_scoring_config(org_id);
CREATE INDEX idx_lead_scoring_config_active ON lead_scoring_config(org_id, is_active);

-- Lead Score Table
CREATE TABLE lead_score (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    total_score INTEGER NOT NULL DEFAULT 0,
    source_score INTEGER DEFAULT 0,
    response_time_score INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    property_match_score INTEGER DEFAULT 0,
    score_breakdown ${json_type},
    last_calculated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_lead_score_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

CREATE INDEX idx_lead_score_dossier_id ON lead_score(dossier_id);
CREATE INDEX idx_lead_score_org_id ON lead_score(org_id);
CREATE INDEX idx_lead_score_total_score ON lead_score(org_id, total_score DESC);
CREATE UNIQUE INDEX idx_lead_score_dossier_unique ON lead_score(dossier_id);

-- Add comments for documentation
COMMENT ON TABLE lead_scoring_config IS 'Configuration for lead scoring rules and weights';
COMMENT ON TABLE lead_score IS 'Calculated scores for leads/dossiers';
COMMENT ON COLUMN lead_scoring_config.auto_qualification_threshold IS 'Minimum score required for automatic qualification';
COMMENT ON COLUMN lead_scoring_config.source_weights IS 'JSON map of lead sources to their weight values';
COMMENT ON COLUMN lead_scoring_config.engagement_weights IS 'JSON map of engagement types to their weight values';
COMMENT ON COLUMN lead_scoring_config.property_match_weights IS 'JSON map of property match criteria to their weight values';
COMMENT ON COLUMN lead_score.score_breakdown IS 'Detailed breakdown of how the score was calculated';


