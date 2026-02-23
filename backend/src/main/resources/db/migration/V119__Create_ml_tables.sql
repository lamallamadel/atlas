-- ML Model Version table
CREATE TABLE ml_model_version (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    metrics ${json_type},
    hyperparameters ${json_type},
    training_data_size INTEGER,
    trained_at TIMESTAMP,
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_model_version_org_id ON ml_model_version(org_id);
CREATE INDEX idx_ml_model_version_is_active ON ml_model_version(org_id, is_active) WHERE is_active = true;
CREATE INDEX idx_ml_model_version_trained_at ON ml_model_version(trained_at DESC);

-- ML Prediction table
CREATE TABLE ml_prediction (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    prediction INTEGER NOT NULL,
    conversion_probability DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    recommended_action VARCHAR(50),
    feature_contributions ${json_type},
    predicted_at TIMESTAMP NOT NULL,
    actual_outcome INTEGER,
    outcome_recorded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ml_prediction_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

CREATE INDEX idx_ml_prediction_dossier_id ON ml_prediction(dossier_id);
CREATE INDEX idx_ml_prediction_org_id ON ml_prediction(org_id);
CREATE INDEX idx_ml_prediction_predicted_at ON ml_prediction(predicted_at DESC);
CREATE INDEX idx_ml_prediction_model_version ON ml_prediction(model_version, org_id);

-- A/B Test Experiment table
CREATE TABLE ab_test_experiment (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    experiment_name VARCHAR(255) NOT NULL,
    description TEXT,
    control_method VARCHAR(50) NOT NULL,
    treatment_method VARCHAR(50) NOT NULL,
    traffic_split DOUBLE PRECISION DEFAULT 0.5,
    status_ VARCHAR(50) NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    control_metrics ${json_type},
    treatment_metrics ${json_type},
    winner VARCHAR(50),
    confidence_level DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_experiment_name_per_org UNIQUE (org_id, experiment_name)
);

CREATE INDEX idx_ab_test_experiment_org_id ON ab_test_experiment(org_id);
CREATE INDEX idx_ab_test_experiment_status ON ab_test_experiment(status, org_id);
CREATE INDEX idx_ab_test_experiment_started_at ON ab_test_experiment(started_at DESC);




