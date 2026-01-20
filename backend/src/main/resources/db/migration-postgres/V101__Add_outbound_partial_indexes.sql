-- Add partial indexes for outbound message processing optimization

-- Index for querying queued messages ready for processing
-- Only indexes rows where status = 'QUEUED' to optimize message processing workloads
CREATE INDEX idx_outbound_message_queued ON outbound_message(status, attempt_count) WHERE status = 'QUEUED';

-- Index for querying attempts that need retry
-- Only indexes rows where next_retry_at is not null to optimize retry scheduling
CREATE INDEX idx_outbound_attempt_pending_retry ON outbound_attempt(next_retry_at) WHERE next_retry_at IS NOT NULL;
