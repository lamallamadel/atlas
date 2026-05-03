-- Add missing audit columns for AppointmentReminderMetricsEntity (extends BaseEntity)
ALTER TABLE appointment_reminder_metrics ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE appointment_reminder_metrics ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Add missing audit columns for conversation flow entities extending BaseEntity
ALTER TABLE conversation_state ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE conversation_state ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE inbound_message ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE inbound_message ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Add missing audit columns for conversation flow entities extending BaseEntity
ALTER TABLE conversation_state ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE conversation_state ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE inbound_message ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE inbound_message ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
