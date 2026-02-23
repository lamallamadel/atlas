-- Initial schema migration

-- Annonce table
CREATE TABLE annonce (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    city VARCHAR(255),
    price DECIMAL(15, 2),
    currency VARCHAR(3),
    status_VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Dossier table
CREATE TABLE dossier (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    annonce_id BIGINT,
    lead_phone VARCHAR(50),
    lead_name VARCHAR(255),
    lead_source VARCHAR(100),
    status_VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_dossier_annonce FOREIGN KEY (annonce_id) REFERENCES annonce(id) ON DELETE SET NULL
);

-- Partie prenante table
CREATE TABLE partie_prenante (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    obj_type VARCHAR(50) NOT NULL,
    obj_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_partie_prenante_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

-- Consentement table
CREATE TABLE consentement (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    partie_prenante_id BIGINT,
    consent_type VARCHAR(100) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_consentement_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE,
    CONSTRAINT fk_consentement_partie_prenante FOREIGN KEY (partie_prenante_id) REFERENCES partie_prenante(id) ON DELETE SET NULL
);

-- Message table
CREATE TABLE message (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    sender VARCHAR(255),
    recipient VARCHAR(255),
    content TEXT,
    message_type VARCHAR(50),
    status_VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_message_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

-- Appointment table
CREATE TABLE appointment (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    location VARCHAR(500),
    status_VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_appointment_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

-- Audit event table
CREATE TABLE audit_event (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    changes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes on annonce
CREATE INDEX idx_annonce_org_id ON annonce(org_id);
CREATE INDEX idx_annonce_status ON annonce(status);
CREATE INDEX idx_annonce_created_at ON annonce(created_at);

-- Indexes on dossier
CREATE INDEX idx_dossier_org_id ON dossier(org_id);
CREATE INDEX idx_dossier_status ON dossier(status);
CREATE INDEX idx_dossier_created_at ON dossier(created_at);
CREATE INDEX idx_dossier_lead_phone ON dossier(lead_phone);

-- Indexes on partie_prenante
CREATE INDEX idx_partie_prenante_org_id ON partie_prenante(org_id);

-- Indexes on consentement
CREATE INDEX idx_consentement_org_id ON consentement(org_id);

-- Indexes on message
CREATE INDEX idx_message_org_id ON message(org_id);
CREATE INDEX idx_message_created_at ON message(created_at);

-- Indexes on appointment
CREATE INDEX idx_appointment_org_id ON appointment(org_id);
CREATE INDEX idx_appointment_status ON appointment(status);
CREATE INDEX idx_appointment_created_at ON appointment(created_at);

-- Indexes on audit_event
CREATE INDEX idx_audit_event_org_id ON audit_event(org_id);
CREATE INDEX idx_audit_event_created_at ON audit_event(created_at);
CREATE INDEX idx_audit_event_entity ON audit_event(entity_type, entity_id);

