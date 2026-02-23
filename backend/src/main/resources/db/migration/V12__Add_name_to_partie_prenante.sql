-- Add name column to partie_prenante table
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS obj_name VARCHAR(255);



