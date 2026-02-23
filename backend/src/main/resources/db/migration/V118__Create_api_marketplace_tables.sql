-- API Key Management
CREATE TABLE api_key (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    tier VARCHAR(20) NOT NULL DEFAULT 'FREE',
    description VARCHAR(1000),
    scopes VARCHAR(1000),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_api_key_key_hash ON api_key(key_hash);
CREATE INDEX idx_api_key_org_status ON api_key(org_id, status);

-- Webhook Subscriptions
CREATE TABLE webhook_subscription (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    secret VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    retry_policy ${json_type},
    headers ${json_type},
    last_triggered_at TIMESTAMP,
    last_success_at TIMESTAMP,
    last_failure_at TIMESTAMP,
    failure_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_webhook_subscription_org_status ON webhook_subscription(org_id, status);
CREATE INDEX idx_webhook_subscription_event_type ON webhook_subscription(event_type);

-- Webhook Delivery Tracking
CREATE TABLE webhook_delivery (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    subscription_id BIGINT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload ${json_type},
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    last_attempt_at TIMESTAMP,
    response_status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_webhook_delivery_subscription FOREIGN KEY (subscription_id) REFERENCES webhook_subscription(id) ON DELETE CASCADE
);

CREATE INDEX idx_webhook_delivery_subscription ON webhook_delivery(subscription_id);
CREATE INDEX idx_webhook_delivery_status ON webhook_delivery(status);
CREATE INDEX idx_webhook_delivery_next_retry ON webhook_delivery(next_retry_at);

-- API Usage Analytics
CREATE TABLE api_usage (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    api_key_id BIGINT NOT NULL,
    usage_date DATE NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    request_count BIGINT DEFAULT 0,
    success_count BIGINT DEFAULT 0,
    error_count BIGINT DEFAULT 0,
    avg_response_time_ms DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_api_usage_api_key FOREIGN KEY (api_key_id) REFERENCES api_key(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_usage_api_key_date ON api_usage(api_key_id, usage_date);
CREATE INDEX idx_api_usage_org_date ON api_usage(org_id, usage_date);
