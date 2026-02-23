-- Create index on metadata column for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_activity_metadata ON activity(metadata);


