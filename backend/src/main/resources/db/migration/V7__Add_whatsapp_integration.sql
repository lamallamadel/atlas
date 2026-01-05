-- Add provider_message_id to message table for idempotency
ALTER TABLE message ADD COLUMN provider_message_id VARCHAR(255);
CREATE UNIQUE INDEX idx_message_provider_message_id ON message(provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Create whatsapp_provider_config table
CREATE TABLE whatsapp_provider_config (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL UNIQUE,
    api_key_encrypted TEXT NOT NULL,
    api_secret_encrypted TEXT NOT NULL,
    webhook_secret_encrypted TEXT NOT NULL,
    phone_number_id VARCHAR(255) NOT NULL,
    business_account_id VARCHAR(255),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_provider_config_org_id ON whatsapp_provider_config(org_id);
