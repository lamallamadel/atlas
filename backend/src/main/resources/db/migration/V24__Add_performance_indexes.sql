-- Performance Optimization Indexes
-- Created as part of performance optimization layer implementation

-- Annonce table indexes
CREATE INDEX IF NOT EXISTS idx_annonce_status ON annonce(status);
CREATE INDEX IF NOT EXISTS idx_annonce_type ON annonce(type);
CREATE INDEX IF NOT EXISTS idx_annonce_city ON annonce(city);
CREATE INDEX IF NOT EXISTS idx_annonce_org_id_status ON annonce(org_id, status);
CREATE INDEX IF NOT EXISTS idx_annonce_org_id_city ON annonce(org_id, city);
CREATE INDEX IF NOT EXISTS idx_annonce_org_id_type ON annonce(org_id, type);
CREATE INDEX IF NOT EXISTS idx_annonce_created_at ON annonce(created_at);

-- Dossier table indexes
CREATE INDEX IF NOT EXISTS idx_dossier_annonce_id ON dossier(annonce_id);
CREATE INDEX IF NOT EXISTS idx_dossier_lead_phone ON dossier(lead_phone);
CREATE INDEX IF NOT EXISTS idx_dossier_lead_email ON dossier(lead_email);
CREATE INDEX IF NOT EXISTS idx_dossier_status ON dossier(status);
CREATE INDEX IF NOT EXISTS idx_dossier_case_type ON dossier(case_type);
CREATE INDEX IF NOT EXISTS idx_dossier_created_by ON dossier(created_by);
CREATE INDEX IF NOT EXISTS idx_dossier_source ON dossier(source);
CREATE INDEX IF NOT EXISTS idx_dossier_org_id_status ON dossier(org_id, status);
CREATE INDEX IF NOT EXISTS idx_dossier_org_id_lead_phone ON dossier(org_id, lead_phone);
CREATE INDEX IF NOT EXISTS idx_dossier_org_id_created_at ON dossier(org_id, created_at);

-- Partie Prenante table indexes
CREATE INDEX IF NOT EXISTS idx_partie_prenante_dossier_id ON partie_prenante(dossier_id);
CREATE INDEX IF NOT EXISTS idx_partie_prenante_role ON partie_prenante(role);
CREATE INDEX IF NOT EXISTS idx_partie_prenante_phone ON partie_prenante(phone);
CREATE INDEX IF NOT EXISTS idx_partie_prenante_email ON partie_prenante(email);

-- Appointment table indexes
CREATE INDEX IF NOT EXISTS idx_appointment_dossier_id ON appointment(dossier_id);
CREATE INDEX IF NOT EXISTS idx_appointment_status ON appointment(status);
CREATE INDEX IF NOT EXISTS idx_appointment_start_time ON appointment(start_time);
CREATE INDEX IF NOT EXISTS idx_appointment_end_time ON appointment(end_time);

-- Message table indexes
CREATE INDEX IF NOT EXISTS idx_message_dossier_id ON message(dossier_id);
CREATE INDEX IF NOT EXISTS idx_message_channel ON message(channel);
CREATE INDEX IF NOT EXISTS idx_message_direction ON message(direction);
CREATE INDEX IF NOT EXISTS idx_message_timestamp ON message(timestamp);
CREATE INDEX IF NOT EXISTS idx_message_dossier_id_direction ON message(dossier_id, direction);
CREATE INDEX IF NOT EXISTS idx_message_dossier_id_timestamp ON message(dossier_id, timestamp);

-- Notification table indexes
CREATE INDEX IF NOT EXISTS idx_notification_dossier_id ON notification(dossier_id);
CREATE INDEX IF NOT EXISTS idx_notification_status ON notification(status);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification(created_at);

-- Outbound Message table indexes
CREATE INDEX IF NOT EXISTS idx_outbound_message_status ON outbound_message(status);
CREATE INDEX IF NOT EXISTS idx_outbound_message_attempt_count ON outbound_message(attempt_count);
CREATE INDEX IF NOT EXISTS idx_outbound_message_channel ON outbound_message(channel);
CREATE INDEX IF NOT EXISTS idx_outbound_message_created_at ON outbound_message(created_at);
CREATE INDEX IF NOT EXISTS idx_outbound_message_next_retry_at ON outbound_message(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_outbound_message_status_attempt_count ON outbound_message(status, attempt_count);
CREATE INDEX IF NOT EXISTS idx_outbound_message_org_id_status ON outbound_message(org_id, status);

-- Outbound Attempt table indexes
CREATE INDEX IF NOT EXISTS idx_outbound_attempt_message_id ON outbound_attempt(message_id);
CREATE INDEX IF NOT EXISTS idx_outbound_attempt_status ON outbound_attempt(status);
CREATE INDEX IF NOT EXISTS idx_outbound_attempt_attempt_number ON outbound_attempt(attempt_number);
CREATE INDEX IF NOT EXISTS idx_outbound_attempt_next_retry_at ON outbound_attempt(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_outbound_attempt_attempted_at ON outbound_attempt(attempted_at);

-- Dossier Status History table indexes
CREATE INDEX IF NOT EXISTS idx_dossier_status_history_dossier_id ON dossier_status_history(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_status_history_from_status ON dossier_status_history(from_status);
CREATE INDEX IF NOT EXISTS idx_dossier_status_history_to_status ON dossier_status_history(to_status);
CREATE INDEX IF NOT EXISTS idx_dossier_status_history_transitioned_at ON dossier_status_history(transitioned_at);
