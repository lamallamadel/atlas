-- Add tour_progress column to user_preferences table
-- This column stores the guided tour progress and completion state for each user

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS tour_progress JSONB DEFAULT '{}'::jsonb;

-- Add index for tour_progress for faster queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_tour_progress
ON user_preferences USING gin (tour_progress);

-- Add comment
COMMENT ON COLUMN user_preferences.tour_progress IS 'Stores guided tour progress and completion state as JSON';
