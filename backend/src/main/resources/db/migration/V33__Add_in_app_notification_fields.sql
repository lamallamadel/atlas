-- Add new fields for in-app notification support
ALTER TABLE notification ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS action_url VARCHAR(500);

-- Add index for unread notifications query performance (H2 compatible - no WHERE clause)
CREATE INDEX IF NOT EXISTS idx_notification_unread ON notification(type, read_at);
