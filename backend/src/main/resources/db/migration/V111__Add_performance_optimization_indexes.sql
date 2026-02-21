-- Performance Optimization Indexes Migration
-- Based on slow query analysis and load testing results

-- Annonce table indexes for common query patterns
-- Note: Removed partial WHERE clause for H2 compatibility (H2 doesn't support partial indexes)
CREATE INDEX IF NOT EXISTS idx_annonce_status_city ON annonce(status, city);
CREATE INDEX IF NOT EXISTS idx_annonce_type_price ON annonce(type, price);
CREATE INDEX IF NOT EXISTS idx_annonce_created_at_desc ON annonce(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annonce_org_status ON annonce(org_id, status);

-- Dossier table indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_dossier_status_created ON dossier(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dossier_annonce_status ON dossier(annonce_id, status);
CREATE INDEX IF NOT EXISTS idx_dossier_org_status ON dossier(org_id, status);
CREATE INDEX IF NOT EXISTS idx_dossier_lead_phone ON dossier(lead_phone);
CREATE INDEX IF NOT EXISTS idx_dossier_lead_email ON dossier(lead_email);
CREATE INDEX IF NOT EXISTS idx_dossier_source_status ON dossier(source, status);

-- Composite index for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_dossier_created_status_org ON dossier(created_at DESC, status, org_id);

-- Message table indexes for conversation retrieval
CREATE INDEX IF NOT EXISTS idx_message_dossier_created ON message(dossier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_channel_status ON message(channel, status);

-- Appointment table indexes
CREATE INDEX IF NOT EXISTS idx_appointment_dossier_scheduled ON appointment(dossier_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointment_status_scheduled ON appointment(status, scheduled_at);

-- Activity table indexes for timeline queries
CREATE INDEX IF NOT EXISTS idx_activity_dossier_created ON activity(dossier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity_type_id ON activity(entity_type, entity_id);

-- Notification table indexes
CREATE INDEX IF NOT EXISTS idx_notification_user_created ON notification(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_read_status ON notification(user_id, read_status, created_at DESC);

-- Outbound messaging indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_outbound_message_status_created ON outbound_message(status, created_at);
CREATE INDEX IF NOT EXISTS idx_outbound_attempt_message_created ON outbound_attempt(outbound_message_id, created_at DESC);

-- Partie prenante indexes for relationship queries
CREATE INDEX IF NOT EXISTS idx_partie_prenante_dossier_role ON partie_prenante(dossier_id, role);

-- Task table indexes
CREATE INDEX IF NOT EXISTS idx_task_dossier_status ON task(dossier_id, status);
-- Note: Removed partial WHERE clause for H2 compatibility (H2 doesn't support partial indexes)
CREATE INDEX IF NOT EXISTS idx_task_assigned_due_date ON task(assigned_to, due_date);

-- Comment thread indexes
CREATE INDEX IF NOT EXISTS idx_comment_thread_dossier ON comment_thread(dossier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_thread_status ON comment(comment_thread_id, created_at DESC);

-- User preferences for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_org ON user_preferences(user_id, org_id);

-- Workflow state indexes
CREATE INDEX IF NOT EXISTS idx_workflow_state_dossier ON workflow_state(dossier_id, current_status);

-- Lead score indexes for scoring queries
CREATE INDEX IF NOT EXISTS idx_lead_score_dossier_score ON lead_score(dossier_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_score_calculated ON lead_score(calculated_at DESC);

-- Referential data indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_referential_org_type ON referential(org_id, referential_type, is_active);

-- Note: Removed partial WHERE clauses for H2 compatibility (H2 doesn't support partial indexes)
-- Index for active sessions (WhatsApp)
CREATE INDEX IF NOT EXISTS idx_whatsapp_session_active ON whatsapp_session_window(phone_number, expires_at);

-- Index for pending rate limits
CREATE INDEX IF NOT EXISTS idx_whatsapp_rate_limit_pending ON whatsapp_rate_limit(phone_number, window_start);

-- Filter preset indexes
CREATE INDEX IF NOT EXISTS idx_filter_preset_user_entity ON filter_preset(user_id, entity_type, is_default);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_document_dossier_created ON document(dossier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_category_created ON document(category, created_at DESC);

-- Note: ANALYZE statements removed for H2 compatibility (H2 doesn't support ANALYZE)
-- PostgreSQL will automatically analyze tables during autovacuum
-- For production PostgreSQL, run ANALYZE manually or enable autovacuum
