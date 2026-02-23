-- Customer Portal Tables Migration

-- Client authentication tokens for magic link login
CREATE TABLE client_auth_token (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_client_auth_token_token ON client_auth_token(token);
CREATE INDEX idx_client_auth_token_dossier ON client_auth_token(dossier_id);
CREATE INDEX idx_client_auth_token_expires ON client_auth_token(expires_at);

-- Secure messages between clients and agents (E2E encrypted)
CREATE TABLE client_secure_message (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    from_client BOOLEAN NOT NULL,
    encrypted_content TEXT NOT NULL,
    initialization_vector VARCHAR(500),
    sender_id VARCHAR(255),
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_client_secure_message_dossier ON client_secure_message(dossier_id, created_at);
CREATE INDEX idx_client_secure_message_unread ON client_secure_message(dossier_id, from_client, read_at);

-- Client appointment requests
CREATE TABLE client_appointment_request (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    proposed_start_time TIMESTAMP NOT NULL,
    proposed_end_time TIMESTAMP NOT NULL,
    preferred_location VARCHAR(500),
    notes TEXT,
    status_ VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    agent_response TEXT,
    appointment_id BIGINT,
    responded_at TIMESTAMP,
    responded_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_client_appointment_request_dossier ON client_appointment_request(dossier_id, created_at);
CREATE INDEX idx_client_appointment_request_status ON client_appointment_request(org_id, status);

-- Client satisfaction surveys
CREATE TABLE client_satisfaction_survey (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    trigger_type VARCHAR(100),
    trigger_entity_id BIGINT,
    overall_rating INTEGER,
    communication_rating INTEGER,
    responsiveness_rating INTEGER,
    professionalism_rating INTEGER,
    comments TEXT,
    additional_data ${json_type},
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_client_satisfaction_survey_dossier ON client_satisfaction_survey(dossier_id, created_at);
CREATE INDEX idx_client_satisfaction_survey_trigger ON client_satisfaction_survey(org_id, trigger_type, trigger_entity_id);



