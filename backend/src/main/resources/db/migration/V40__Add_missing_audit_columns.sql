-- V40: Add audit columns (created_by, updated_by) to all tables
-- All entities inherit from BaseEntity which includes @CreatedBy and @LastModifiedBy annotations
-- This migration ensures all tables have these columns in sync with JPA entity definitions

-- Add created_by and updated_by to all tables that inherit from BaseEntity
ALTER TABLE activity_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE activity_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE annonce ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE appointment_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE appointment_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE audit_event_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE audit_event_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE comment_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE comment_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE comment_thread_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE comment_thread_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE consentement_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE consentement_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE coop_contribution ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE coop_contribution ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE coop_group ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE coop_group ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE coop_lot ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE coop_lot ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE coop_member ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE coop_member ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE coop_project ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE coop_project ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE document_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE document_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE dossier ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE dossier_status_history ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE dossier_status_history ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE email_provider_config ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE email_provider_config ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE filter_preset ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE import_job_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE import_job_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE message_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE message_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- message_template now has created_by/updated_by from V37, but these are safe no-ops
ALTER TABLE message_template ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE message_template ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE notification_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE notification_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE outbound_attempt_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE outbound_attempt_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE outbound_message_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE outbound_message_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE partie_prenante_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE partie_prenante_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE rate_limit_tier ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE rate_limit_tier ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE referential_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE referential_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE referential_version_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE referential_version_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE sms_provider_config ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE sms_provider_config ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE sms_rate_limit ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE sms_rate_limit ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE suggestion_template ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE suggestion_template ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE task_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE task_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE template_variable ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE template_variable ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE user_behavior_pattern ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE user_behavior_pattern ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE user_preferences_entity ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE user_preferences_entity ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE whatsapp_provider_config ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE whatsapp_provider_config ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE whatsapp_rate_limit ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE whatsapp_rate_limit ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE whatsapp_session_window ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE whatsapp_session_window ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE whatsapp_template ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE whatsapp_template ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE workflow_definition ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE workflow_definition ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE workflow_transition ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE workflow_transition ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Add indices for audit columns
CREATE INDEX IF NOT EXISTS idx_activity_created_by ON activity_entity(created_by);
CREATE INDEX IF NOT EXISTS idx_activity_updated_by ON activity_entity(updated_by);

CREATE INDEX IF NOT EXISTS idx_message_template_created_by ON message_template(created_by);
CREATE INDEX IF NOT EXISTS idx_message_template_updated_by ON message_template(updated_by);
