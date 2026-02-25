-- Add session tracking fields to outbound_message for MDC context propagation
ALTER TABLE outbound_message ADD COLUMN session_id VARCHAR(255);
ALTER TABLE outbound_message ADD COLUMN run_id VARCHAR(255);
ALTER TABLE outbound_message ADD COLUMN hypothesis_id VARCHAR(255);

-- Add indexes for tracking fields to support filtering and reporting
CREATE INDEX idx_outbound_message_session_id ON outbound_message(session_id);
CREATE INDEX idx_outbound_message_run_id ON outbound_message(run_id);
CREATE INDEX idx_outbound_message_hypothesis_id ON outbound_message(hypothesis_id);
