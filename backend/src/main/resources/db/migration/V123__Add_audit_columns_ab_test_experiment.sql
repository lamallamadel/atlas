-- Add audit columns to ab_test_experiment (BaseEntity requires created_by, updated_by)
ALTER TABLE ab_test_experiment ADD COLUMN created_by VARCHAR(255);
ALTER TABLE ab_test_experiment ADD COLUMN updated_by VARCHAR(255);
