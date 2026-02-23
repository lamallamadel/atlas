-- Performance Optimization Indexes Migration
-- Based on slow query analysis and load testing results

-- Annonce table indexes for common query patterns
-- Note: Removed partial WHERE clause for H2 compatibility (H2 doesn't support partial indexes)
CREATE INDEX IF NOT EXISTS idx_annonce_status_city ON annonce(status, city);
-- Note: idx_annonce_type_price moved to migration-postgres (H2 reserved word: type)
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
-- channel column added in V10, status column exists in V1
CREATE INDEX IF NOT EXISTS idx_message_channel_status ON message(channel, status);

-- Appointment table indexes (start_time is the actual column name in V4 schema)
CREATE INDEX IF NOT EXISTS idx_appointment_dossier_start ON appointment(dossier_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointment_status_start ON appointment(status, start_time);

-- Activity table indexes for timeline queries
-- Note: activity table (V9) has dossier_id and created_at but NO entity_type/entity_id columns
-- Those columns belong to audit_event and comment_thread, not activity
CREATE INDEX IF NOT EXISTS idx_activity_dossier_created ON activity(dossier_id, created_at DESC);

-- Outbound messaging indexes (tables created in V13)
CREATE INDEX IF NOT EXISTS idx_outbound_message_status_created ON outbound_message(status, created_at);
CREATE INDEX IF NOT EXISTS idx_outbound_attempt_message_created ON outbound_attempt(outbound_message_id, created_at DESC);

-- Note: idx_partie_prenante_dossier_type moved to migration-postgres (H2 reserved word: type)

-- Task table indexes (table created in V22)
CREATE INDEX IF NOT EXISTS idx_task_dossier_status ON task(dossier_id, status);
-- Note: Removed partial WHERE clause for H2 compatibility (H2 doesn't support partial indexes)
CREATE INDEX IF NOT EXISTS idx_task_assigned_due_date ON task(assigned_to, due_date);

-- Comment indexes (tables created in V36)
-- Note: comment_thread has entity_type/entity_id (not dossier_id); comment uses thread_id (not comment_thread_id)
CREATE INDEX IF NOT EXISTS idx_comment_thread_created_at ON comment_thread(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_thread_id_created ON comment(thread_id, created_at DESC);

-- User preferences for fast lookup (table created in V34, user_id/org_id columns confirmed)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_org ON user_preferences(user_id, org_id);

-- Lead score indexes (table created in V109; column is total_score, not score; last_calculated_at not calculated_at)
CREATE INDEX IF NOT EXISTS idx_lead_score_dossier_total ON lead_score(dossier_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_score_last_calculated ON lead_score(last_calculated_at DESC);

-- Referential data indexes (table created in V14; column is 'category' not 'referential_type')
CREATE INDEX IF NOT EXISTS idx_referential_org_category ON referential(org_id, category, is_active);

-- Note: Removed partial WHERE clauses for H2 compatibility (H2 doesn't support partial indexes)
-- WhatsApp session window index (V26 schema: phone_number and window_expires_at, not expires_at)
CREATE INDEX IF NOT EXISTS idx_whatsapp_session_active ON whatsapp_session_window(phone_number, window_expires_at);

-- WhatsApp rate limit index (V26 schema: org_id and reset_at; no phone_number or window_start columns)
CREATE INDEX IF NOT EXISTS idx_whatsapp_rate_limit_reset ON whatsapp_rate_limit(org_id, reset_at);

-- Filter preset indexes (V35 schema: org_id, filter_type, is_shared; no user_id, entity_type, is_default)
CREATE INDEX IF NOT EXISTS idx_filter_preset_org_type ON filter_preset(org_id, filter_type, is_shared);

-- Document indexes (category column added in V19)
CREATE INDEX IF NOT EXISTS idx_document_dossier_created ON document(dossier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_category_created ON document(category, created_at DESC);

-- Note: ANALYZE statements removed for H2 compatibility (H2 doesn't support ANALYZE)
-- PostgreSQL will automatically analyze tables during autovacuum
-- For production PostgreSQL, run ANALYZE manually or enable autovacuum
