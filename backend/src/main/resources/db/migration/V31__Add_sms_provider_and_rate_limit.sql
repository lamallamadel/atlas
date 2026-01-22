-- V30: Add SMS provider configuration and rate limiting tables

-- Create SMS provider config table
CREATE TABLE sms_provider_config (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL,
    twilio_account_sid VARCHAR(255),
    twilio_auth_token_encrypted TEXT,
    twilio_from_number VARCHAR(50),
    aws_access_key_encrypted TEXT,
    aws_secret_key_encrypted TEXT,
    aws_region VARCHAR(50),
    aws_sender_id VARCHAR(50),
    webhook_secret_encrypted TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_sms_provider_config_org_id UNIQUE (org_id)
);

CREATE INDEX idx_sms_provider_config_org_id ON sms_provider_config(org_id);
-- Portable (H2 + Postgres)
CREATE INDEX idx_sms_provider_config_enabled ON sms_provider_config(enabled);


-- Create SMS rate limit table
CREATE TABLE sms_rate_limit (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    quota_limit INTEGER NOT NULL DEFAULT 1000,
    messages_sent_count INTEGER NOT NULL DEFAULT 0,
    rate_limit_window_seconds INTEGER NOT NULL DEFAULT 86400,
    reset_at TIMESTAMP NOT NULL,
    throttle_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_sms_rate_limit_org_id UNIQUE (org_id)
);

CREATE INDEX idx_sms_rate_limit_org_id ON sms_rate_limit(org_id);
CREATE INDEX idx_sms_rate_limit_throttle ON sms_rate_limit(throttle_until) WHERE throttle_until IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE sms_provider_config IS 'Configuration for SMS providers (Twilio, AWS SNS) per organization';
COMMENT ON COLUMN sms_provider_config.provider_type IS 'Provider type: TWILIO or AWS_SNS';
COMMENT ON COLUMN sms_provider_config.twilio_account_sid IS 'Twilio Account SID';
COMMENT ON COLUMN sms_provider_config.twilio_auth_token_encrypted IS 'Encrypted Twilio Auth Token';
COMMENT ON COLUMN sms_provider_config.aws_access_key_encrypted IS 'Encrypted AWS Access Key';
COMMENT ON COLUMN sms_provider_config.aws_secret_key_encrypted IS 'Encrypted AWS Secret Key';
COMMENT ON COLUMN sms_provider_config.webhook_secret_encrypted IS 'Encrypted webhook secret for signature verification';

COMMENT ON TABLE sms_rate_limit IS 'Rate limiting and quota management for SMS sending per organization';
COMMENT ON COLUMN sms_rate_limit.quota_limit IS 'Maximum number of SMS messages allowed in the rate limit window';
COMMENT ON COLUMN sms_rate_limit.messages_sent_count IS 'Current count of messages sent in the current window';
COMMENT ON COLUMN sms_rate_limit.throttle_until IS 'Timestamp until which sending is throttled due to rate limit errors';
