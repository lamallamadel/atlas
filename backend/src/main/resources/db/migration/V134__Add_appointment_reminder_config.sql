-- Add reminder_channels array to appointment table
ALTER TABLE appointment ADD COLUMN reminder_channels ${json_type} DEFAULT '["WHATSAPP","SMS","EMAIL"]'::${json_type};

-- Add template_code column to appointment table
ALTER TABLE appointment ADD COLUMN template_code VARCHAR(255);

-- Create index for template_code lookups
CREATE INDEX IF NOT EXISTS idx_appointment_template_code ON appointment(template_code);
