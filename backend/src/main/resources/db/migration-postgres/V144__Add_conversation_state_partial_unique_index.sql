-- Create unique constraint for active conversation per phone number (PostgreSQL partial index).
-- Only one row per (org_id, phone_number) can have expires_at > CURRENT_TIMESTAMP.
CREATE UNIQUE INDEX idx_conversation_state_active_phone ON conversation_state(org_id, phone_number) WHERE expires_at > CURRENT_TIMESTAMP;
