-- WhatsApp Session Window Tracking Table
CREATE TABLE IF NOT EXISTS whatsapp_session_window (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    window_opens_at TIMESTAMP NOT NULL,
    window_expires_at TIMESTAMP NOT NULL,
    last_inbound_message_at TIMESTAMP NOT NULL,
    last_outbound_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_session_org_phone UNIQUE (org_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_session_org_phone ON whatsapp_session_window(org_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_session_window_expires ON whatsapp_session_window(window_expires_at);

-- WhatsApp Rate Limit and Quota Management Table
CREATE TABLE IF NOT EXISTS whatsapp_rate_limit (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    messages_sent_count INTEGER NOT NULL DEFAULT 0,
    quota_limit INTEGER NOT NULL DEFAULT 1000,
    reset_at TIMESTAMP NOT NULL,
    rate_limit_window_seconds INTEGER NOT NULL DEFAULT 86400,
    last_request_at TIMESTAMP,
    throttle_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_rate_limit_org UNIQUE (org_id)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_org_reset ON whatsapp_rate_limit(org_id, reset_at);


