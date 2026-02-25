-- Create inbound_message table for storing incoming WhatsApp messages
CREATE TABLE inbound_message (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    provider_message_id VARCHAR(255),
    received_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create conversation_state table for managing conversation FSM
CREATE TABLE conversation_state (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    context_data ${json_type},
    appointment_id BIGINT,
    dossier_id BIGINT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversation_state_appointment FOREIGN KEY (appointment_id) REFERENCES appointment(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_state_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX idx_inbound_message_org_id ON inbound_message(org_id);
CREATE INDEX idx_inbound_message_phone_number ON inbound_message(phone_number);
CREATE INDEX idx_inbound_message_provider_message_id ON inbound_message(provider_message_id);
CREATE INDEX idx_inbound_message_received_at ON inbound_message(received_at);
CREATE INDEX idx_inbound_message_processed_at ON inbound_message(processed_at);
CREATE INDEX idx_inbound_message_org_phone ON inbound_message(org_id, phone_number);

CREATE INDEX idx_conversation_state_org_id ON conversation_state(org_id);
CREATE INDEX idx_conversation_state_phone_number ON conversation_state(phone_number);
CREATE INDEX idx_conversation_state_state ON conversation_state(state);
CREATE INDEX idx_conversation_state_appointment_id ON conversation_state(appointment_id);
CREATE INDEX idx_conversation_state_dossier_id ON conversation_state(dossier_id);
CREATE INDEX idx_conversation_state_expires_at ON conversation_state(expires_at);
CREATE INDEX idx_conversation_state_org_phone ON conversation_state(org_id, phone_number);

-- Create unique constraint for active conversation per phone number
CREATE UNIQUE INDEX idx_conversation_state_active_phone ON conversation_state(org_id, phone_number) WHERE expires_at > CURRENT_TIMESTAMP;
