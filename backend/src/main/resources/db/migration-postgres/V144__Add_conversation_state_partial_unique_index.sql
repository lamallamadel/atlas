-- Create unique constraint for active pending conversation per phone number.
-- Partial index predicates must use immutable expressions; avoid CURRENT_TIMESTAMP here.
CREATE UNIQUE INDEX idx_conversation_state_active_phone
ON conversation_state(org_id, phone_number)
WHERE state = 'AWAITING_CONFIRMATION';
