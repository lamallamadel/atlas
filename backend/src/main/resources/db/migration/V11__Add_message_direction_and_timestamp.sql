-- Add missing columns to message table for E2E tests

-- 1. ADD direction VARCHAR(50) NOT NULL to message table with default 'INBOUND'
ALTER TABLE message ADD COLUMN direction VARCHAR(50) NOT NULL DEFAULT 'INBOUND';

-- 2. ADD timestamp TIMESTAMP to message table
ALTER TABLE message ADD COLUMN timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. Create index on timestamp for performance
CREATE INDEX idx_message_timestamp ON message(timestamp);


