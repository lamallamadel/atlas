-- Add metadata column to activity table for storing standardized JSON metadata
ALTER TABLE activity ADD COLUMN IF NOT EXISTS metadata ${json_type};

-- Create index on metadata column for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_activity_metadata ON activity USING GIN (metadata);

-- Add comment explaining the metadata structure
COMMENT ON COLUMN activity.metadata IS 'Standardized JSON metadata for activity events. Structure varies by activity type:
- STATUS_CHANGE: {fromStatus, toStatus, userId, reason, timestamp}
- MESSAGE_SENT: {outboundMessageId, channel, to, status, providerMessageId, attemptCount, templateCode, timestamp}
- MESSAGE_FAILED: {outboundMessageId, channel, to, status, errorCode, errorMessage, reason, attemptCount, maxAttempts, templateCode, timestamp}
- APPOINTMENT_SCHEDULED: {appointmentId, status, startTime, endTime, location, assignedTo, timestamp}
- APPOINTMENT_COMPLETED: {appointmentId, status, startTime, endTime, location, assignedTo, notes, timestamp}
- CONSENT_GRANTED: {consentementId, channel, consentType, status, consentMeta, timestamp}
- CONSENT_REVOKED: {consentementId, channel, consentType, status, previousStatus, consentMeta, timestamp}';
