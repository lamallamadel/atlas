-- Create appointment_reminder_metrics table for tracking reminder performance
CREATE TABLE appointment_reminder_metrics (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    appointment_id BIGINT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    template_code VARCHAR(255),
    agent_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_reason TEXT,
    no_show_occurred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_reminder_metrics_appointment FOREIGN KEY (appointment_id) REFERENCES appointment(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX idx_appointment_reminder_metrics_org_id ON appointment_reminder_metrics(org_id);
CREATE INDEX idx_appointment_reminder_metrics_appointment_id ON appointment_reminder_metrics(appointment_id);
CREATE INDEX idx_appointment_reminder_metrics_channel ON appointment_reminder_metrics(channel);
CREATE INDEX idx_appointment_reminder_metrics_status ON appointment_reminder_metrics(status);
CREATE INDEX idx_appointment_reminder_metrics_template_code ON appointment_reminder_metrics(template_code);
CREATE INDEX idx_appointment_reminder_metrics_agent_id ON appointment_reminder_metrics(agent_id);
CREATE INDEX idx_appointment_reminder_metrics_sent_at ON appointment_reminder_metrics(sent_at);
CREATE INDEX idx_appointment_reminder_metrics_org_sent_at ON appointment_reminder_metrics(org_id, sent_at);
CREATE INDEX idx_appointment_reminder_metrics_channel_status ON appointment_reminder_metrics(channel, status);
