-- Add tour_progress column to user_preferences table
-- This column stores the guided tour progress and completion state for each user

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS tour_progress ${json_type} DEFAULT '{}';

