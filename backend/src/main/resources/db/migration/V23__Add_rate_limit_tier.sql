-- Add rate_limit_tier table for configurable rate limits per organization
CREATE TABLE rate_limit_tier (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    tier_name VARCHAR(50) NOT NULL,
    requests_per_minute INTEGER NOT NULL CHECK (requests_per_minute > 0),
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_rate_limit_tier_org_id UNIQUE (org_id)
);

-- Create index on org_id for fast lookups
CREATE INDEX idx_rate_limit_tier_org_id ON rate_limit_tier(org_id);

-- Insert default tier configurations
INSERT INTO rate_limit_tier (org_id, tier_name, requests_per_minute, description, created_at, updated_at) 
VALUES 
    ('default', 'STANDARD', 100, 'Default standard tier with 100 requests per minute', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('premium-example', 'PREMIUM', 1000, 'Example premium tier with 1000 requests per minute', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
