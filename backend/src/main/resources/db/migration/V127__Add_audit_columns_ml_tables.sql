-- Add audit columns to ml_model_version and ml_prediction (BaseEntity)
ALTER TABLE ml_model_version ADD COLUMN created_by VARCHAR(255);
ALTER TABLE ml_model_version ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE ml_prediction ADD COLUMN created_by VARCHAR(255);
ALTER TABLE ml_prediction ADD COLUMN updated_by VARCHAR(255);
