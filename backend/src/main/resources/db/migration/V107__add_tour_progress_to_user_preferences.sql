-- Add tour_progress column to user_preferences table
-- This column stores the guided tour progress and completion state for each user

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS tour_progress ${json_type} DEFAULT '{}';

-- Add index for tour_progress for faster queries (PostgreSQL-specific GIN index)
-- Note: This index creation will be skipped in H2 as it doesn't support GIN indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'user_preferences') THEN
        CREATE INDEX IF NOT EXISTS idx_user_preferences_tour_progress
        ON user_preferences USING gin (tour_progress);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Silently ignore if GIN index creation fails (e.g., in H2)
    NULL;
END $$;

-- Add comment
COMMENT ON COLUMN user_preferences.tour_progress IS 'Stores guided tour progress and completion state as JSON';


