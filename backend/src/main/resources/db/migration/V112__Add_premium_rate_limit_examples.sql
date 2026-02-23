-- Add additional example rate limit tier configurations for testing and documentation

-- Add an enterprise tier example
INSERT INTO rate_limit_tier (org_id, tier_name, requests_per_minute, description, created_at, updated_at) 
VALUES 
    ('enterprise-example', 'ENTERPRISE', 5000, 'Example enterprise tier with 5000 requests per minute', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (org_id) DO NOTHING;

-- Add a developer tier example
INSERT INTO rate_limit_tier (org_id, tier_name, requests_per_minute, description, created_at, updated_at) 
VALUES 
    ('developer-example', 'DEVELOPER', 50, 'Example developer tier with 50 requests per minute for testing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (org_id) DO NOTHING;

-- Add a free tier example
INSERT INTO rate_limit_tier (org_id, tier_name, requests_per_minute, description, created_at, updated_at) 
VALUES 
    ('free-tier-example', 'FREE', 30, 'Example free tier with 30 requests per minute', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (org_id) DO NOTHING;


