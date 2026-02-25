-- Add reminder_sent column to appointment table to track if a reminder has been sent
ALTER TABLE appointment ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

-- Create an index to optimize the scheduler queries (filtering by status, start_time, and reminder_sent)
CREATE INDEX IF NOT EXISTS idx_appointment_reminder ON appointment(status, start_time, reminder_sent);
