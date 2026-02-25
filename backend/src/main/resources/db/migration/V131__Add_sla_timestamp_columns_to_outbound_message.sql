-- Add SLA tracking timestamp columns to outbound_message table
-- These columns track the progression of messages through different states
-- to enable latency monitoring and SLA tracking

ALTER TABLE outbound_message ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
ALTER TABLE outbound_message ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE outbound_message ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Add basic indexes for efficient querying of SLA metrics (H2 compatible - no partial indexes)
CREATE INDEX IF NOT EXISTS idx_outbound_message_sent_at ON outbound_message(sent_at);
CREATE INDEX IF NOT EXISTS idx_outbound_message_delivered_at ON outbound_message(delivered_at);
CREATE INDEX IF NOT EXISTS idx_outbound_message_read_at ON outbound_message(read_at);

-- Add composite indexes for SLA queries by channel and timestamps
CREATE INDEX IF NOT EXISTS idx_outbound_message_channel_created_at ON outbound_message(channel, created_at);
CREATE INDEX IF NOT EXISTS idx_outbound_message_status_updated_at ON outbound_message(status, updated_at);
