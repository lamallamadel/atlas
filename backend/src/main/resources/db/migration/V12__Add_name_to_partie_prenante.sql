-- Add name column to partie_prenante table
ALTER TABLE partie_prenante ADD COLUMN IF NOT EXISTS name VARCHAR(255);
