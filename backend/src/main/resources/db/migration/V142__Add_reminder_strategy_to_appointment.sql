ALTER TABLE appointment ADD COLUMN reminder_strategy VARCHAR(50) DEFAULT 'STANDARD';

UPDATE appointment SET reminder_strategy = 'STANDARD' WHERE reminder_strategy IS NULL;

ALTER TABLE appointment_reminder_metrics ADD COLUMN reminder_strategy VARCHAR(50);
ALTER TABLE appointment_reminder_metrics ADD COLUMN no_show_probability DOUBLE PRECISION;
