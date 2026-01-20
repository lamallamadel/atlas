-- Add outbound messaging infrastructure tables

-- Outbound message table
CREATE TABLE outbound_message (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT,
    channel VARCHAR(50) NOT NULL,
    direction VARCHAR(50) NOT NULL DEFAULT 'OUTBOUND',
    to_recipient VARCHAR(255) NOT NULL,
    template_code VARCHAR(255),
    subject VARCHAR(500),
    payload_json JSONB,
    status VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255),
    idempotency_key VARCHAR(255) NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    error_code VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_outbound_message_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE SET NULL,
    CONSTRAINT uk_outbound_idempotency UNIQUE (org_id, idempotency_key)
);

-- Outbound attempt table for tracking retry attempts
CREATE TABLE outbound_attempt (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    outbound_message_id BIGINT NOT NULL,
    attempt_no INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_code VARCHAR(100),
    error_message TEXT,
    provider_response_json JSONB,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_outbound_attempt_message FOREIGN KEY (outbound_message_id) REFERENCES outbound_message(id) ON DELETE CASCADE
);

-- Indexes for outbound_message
CREATE INDEX idx_outbound_message_org_id ON outbound_message(org_id);
CREATE INDEX idx_outbound_message_dossier_id ON outbound_message(dossier_id);
CREATE INDEX idx_outbound_message_status ON outbound_message(status);
CREATE INDEX idx_outbound_message_created_at ON outbound_message(created_at);
CREATE INDEX idx_outbound_message_provider_id ON outbound_message(provider_message_id);
CREATE INDEX idx_outbound_message_status_attempts ON outbound_message(status, attempt_count);

-- Indexes for outbound_attempt
CREATE INDEX idx_outbound_attempt_org_id ON outbound_attempt(org_id);
CREATE INDEX idx_outbound_attempt_message_id ON outbound_attempt(outbound_message_id);
CREATE INDEX idx_outbound_attempt_next_retry ON outbound_attempt(next_retry_at);
