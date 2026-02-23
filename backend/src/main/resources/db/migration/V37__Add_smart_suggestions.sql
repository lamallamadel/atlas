-- Smart Suggestions System
-- Tracks user behavior patterns and provides intelligent next-best-action suggestions
-- Using ${json_type} placeholder: JSONB for PostgreSQL, JSON for H2

-- User behavior tracking table
CREATE TABLE user_behavior_pattern (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    context_type VARCHAR(100),
    context_id BIGINT,
    frequency_count INTEGER DEFAULT 1,
    last_performed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT unique_user_behavior UNIQUE (org_id, user_id, action_type, context_type, context_id)
);

CREATE INDEX idx_user_behavior_user_id ON user_behavior_pattern(org_id, user_id);
CREATE INDEX idx_user_behavior_last_performed ON user_behavior_pattern(last_performed_at DESC);
CREATE INDEX idx_user_behavior_frequency ON user_behavior_pattern(frequency_count DESC);

-- Suggestion templates table
CREATE TABLE suggestion_template (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    trigger_condition VARCHAR(100) NOT NULL,
    suggestion_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    action_type VARCHAR(100) NOT NULL,
    action_payload ${json_type},
    priority INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_suggestion_template_trigger ON suggestion_template(org_id, trigger_condition, is_active);
CREATE INDEX idx_suggestion_template_priority ON suggestion_template(priority DESC);

-- Message templates for quick actions
CREATE TABLE message_template (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    obj_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables ${json_type},
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_message_template_category ON message_template(org_id, category, is_active);
CREATE INDEX idx_message_template_usage ON message_template(usage_count DESC);

-- Suggestion feedback for machine learning improvement
CREATE TABLE suggestion_feedback (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    suggestion_type VARCHAR(100) NOT NULL,
    context_type VARCHAR(100),
    context_id BIGINT,
    was_accepted BOOLEAN NOT NULL,
    feedback_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_suggestion_feedback_user ON suggestion_feedback(org_id, user_id);
CREATE INDEX idx_suggestion_feedback_type ON suggestion_feedback(suggestion_type, was_accepted);
CREATE INDEX idx_suggestion_feedback_created ON suggestion_feedback(created_at DESC);

-- Seed default suggestion templates
INSERT INTO suggestion_template (org_id, trigger_condition, suggestion_type, title, description, action_type, action_payload, priority) VALUES
('default', 'DOSSIER_INACTIVE_3_DAYS', 'FOLLOW_UP', 'Rappeler le client', 'Ce dossier est inactif depuis 3 jours. Il serait temps de relancer le contact.', 'SEND_MESSAGE', '{"channel": "EMAIL", "templateId": null}', 8),
('default', 'STATUS_QUALIFIED', 'SCHEDULE_APPOINTMENT', 'Planifier un rendez-vous', 'Le dossier est qualifié. Proposez un rendez-vous au client pour finaliser.', 'CREATE_APPOINTMENT', '{}', 9),
('default', 'STATUS_NEW', 'QUALIFY_LEAD', 'Qualifier le prospect', 'Nouveau prospect à qualifier. Contactez-le pour évaluer son intérêt.', 'UPDATE_STATUS', '{"targetStatus": "QUALIFYING"}', 7),
('default', 'NO_ACTIVITY_7_DAYS', 'URGENT_FOLLOW_UP', 'Relance urgente requise', 'Aucune activité depuis 7 jours. Risque de perte du dossier.', 'SEND_MESSAGE', '{"channel": "PHONE"}', 10),
('default', 'APPOINTMENT_COMPLETED', 'SEND_FOLLOW_UP', 'Envoyer un suivi', 'Rendez-vous terminé. Envoyez un message de suivi au client.', 'SEND_MESSAGE', '{"channel": "EMAIL", "templateCategory": "FOLLOW_UP"}', 6);

-- Seed default message templates
INSERT INTO message_template (org_id, name, category, channel, subject, content, variables) VALUES
('default', 'Relance après 3 jours', 'FOLLOW_UP', 'EMAIL', 'Suite à votre demande', 'Bonjour {{leadName}},\n\nJe reviens vers vous concernant votre demande pour {{annonceTitle}}.\n\nEtes-vous toujours intéressé(e) ? N''hésitez pas à me contacter pour toute question.\n\nCordialement', '["leadName", "annonceTitle"]'),
('default', 'Proposition de rendez-vous', 'APPOINTMENT', 'EMAIL', 'Proposition de rendez-vous', 'Bonjour {{leadName}},\n\nSuite à notre échange, je vous propose un rendez-vous pour visiter le bien.\n\nSeriez-vous disponible {{proposedDate}} ?\n\nCordialement', '["leadName", "proposedDate"]'),
('default', 'Relance urgente', 'URGENT', 'SMS', NULL, 'Bonjour, nous n''avons pas eu de nouvelles depuis plusieurs jours. Êtes-vous toujours intéressé(e) ? Répondez-moi pour qu''on avance ensemble.', '[]'),
('default', 'Suivi post-rendez-vous', 'FOLLOW_UP', 'EMAIL', 'Suite à notre rendez-vous', 'Bonjour {{leadName}},\n\nMerci pour le temps que vous m''avez accordé lors de notre rendez-vous.\n\nAvez-vous des questions supplémentaires ? Je reste à votre disposition.\n\nCordialement', '["leadName"]'),
('default', 'Première qualification', 'QUALIFICATION', 'EMAIL', 'Informations complémentaires', 'Bonjour {{leadName}},\n\nMerci pour votre intérêt. Pour mieux vous accompagner, pourriez-vous me préciser :\n- Votre budget\n- Vos critères prioritaires\n- Votre calendrier de recherche\n\nJe reviendrai vers vous rapidement.\n\nCordialement', '["leadName"]');



