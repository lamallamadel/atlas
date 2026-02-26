-- Add whatsapp_quota_tier column to organization_settings table
ALTER TABLE organization_settings 
ADD COLUMN IF NOT EXISTS whatsapp_quota_tier INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_org_settings_quota_tier 
ON organization_settings(whatsapp_quota_tier);

-- Create whatsapp_cost_tracking table
CREATE TABLE IF NOT EXISTS whatsapp_cost_tracking (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    message_id BIGINT,
    conversation_type VARCHAR(50) NOT NULL,
    cost_per_conversation DECIMAL(10, 5) NOT NULL,
    phone_number VARCHAR(50),
    conversation_opened_at TIMESTAMP NOT NULL,
    conversation_closed_at TIMESTAMP,
    message_count INTEGER NOT NULL DEFAULT 1,
    total_cost DECIMAL(10, 5) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_org_id 
ON whatsapp_cost_tracking(org_id);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_org_created 
ON whatsapp_cost_tracking(org_id, created_at);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_message_id 
ON whatsapp_cost_tracking(message_id);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_conversation_opened 
ON whatsapp_cost_tracking(conversation_opened_at);

COMMENT ON TABLE whatsapp_cost_tracking IS 'Tracks WhatsApp conversation costs based on Meta pricing model';
COMMENT ON COLUMN whatsapp_cost_tracking.conversation_type IS 'Type of conversation: MARKETING, UTILITY, AUTHENTICATION, SERVICE';
COMMENT ON COLUMN whatsapp_cost_tracking.cost_per_conversation IS 'Cost per conversation in USD based on Meta pricing';
COMMENT ON COLUMN organization_settings.whatsapp_quota_tier IS 'WhatsApp tier: 1=1000/day, 2=10000/day, 3=100000/day, 4=unlimited';
