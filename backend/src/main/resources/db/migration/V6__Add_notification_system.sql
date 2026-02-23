-- Create notification table
CREATE TABLE notification (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    obj_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    template_id VARCHAR(255) NOT NULL,
    variables ${json_type},
    recipient VARCHAR(500) NOT NULL,
    subject VARCHAR(500),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT chk_notification_type CHECK (type IN ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP')),
    CONSTRAINT chk_notification_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

-- Create indexes for notification table
CREATE INDEX idx_notification_org_id ON notification(org_id);
CREATE INDEX idx_notification_status ON notification(status);
CREATE INDEX idx_notification_type ON notification(obj_type);
CREATE INDEX idx_notification_created_at ON notification(created_at);
CREATE INDEX idx_notification_status_retry ON notification(status, retry_count);

