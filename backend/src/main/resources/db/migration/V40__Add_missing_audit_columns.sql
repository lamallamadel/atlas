-- Add audit columns (created_by, updated_by) to all tables missing them
-- This is a catch-all migration for entities that have audit fields in code but missing in DB

-- filter_preset: add updated_by
ALTER TABLE filter_preset ADD COLUMN updated_by VARCHAR(255);

-- message_template: add created_by and updated_by
ALTER TABLE message_template ADD COLUMN created_by VARCHAR(255);
ALTER TABLE message_template ADD COLUMN updated_by VARCHAR(255);

-- Add more as discovered...
-- Indices for audit columns (for filtering/sorting)
CREATE INDEX idx_filter_preset_updated_by ON filter_preset(updated_by);
CREATE INDEX idx_message_template_created_by ON message_template(created_by);
CREATE INDEX idx_message_template_updated_by ON message_template(updated_by);
