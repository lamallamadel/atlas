-- Add email provider configuration table

CREATE TABLE email_provider_config (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL,
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_username VARCHAR(255),
    smtp_password_encrypted TEXT,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    api_key_encrypted TEXT,
    webhook_secret_encrypted TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    use_tls BOOLEAN NOT NULL DEFAULT TRUE,
    use_ssl BOOLEAN NOT NULL DEFAULT FALSE,
    reply_to_email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for email_provider_config
CREATE INDEX idx_email_provider_config_org_id ON email_provider_config(org_id);
CREATE INDEX idx_email_provider_config_enabled ON email_provider_config(enabled);

-- Add email-related columns to message table
ALTER TABLE message ADD COLUMN from_address VARCHAR(255);
ALTER TABLE message ADD COLUMN to_address VARCHAR(255);
ALTER TABLE message ADD COLUMN subject VARCHAR(500);
ALTER TABLE message ADD COLUMN html_content TEXT;
ALTER TABLE message ADD COLUMN text_content TEXT;
ALTER TABLE message ADD COLUMN attachments_json ${json_type};

-- Add index on email addresses
CREATE INDEX idx_message_from_address ON message(from_address);
CREATE INDEX idx_message_to_address ON message(to_address);

-- Add email lookup to dossier
ALTER TABLE dossier ADD COLUMN lead_email VARCHAR(255);

-- Add index on lead_email
CREATE INDEX idx_dossier_lead_email ON dossier(lead_email);

-- Add email to partie_prenante index if not exists
CREATE INDEX IF NOT EXISTS idx_partie_prenante_email ON partie_prenante(email);
