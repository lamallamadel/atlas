-- Cas d'usage n°1, lot A (UC-P4) : échanges entre le propriétaire et le prospect sur la
-- plateforme, et créneaux de visite proposés au prospect.

-- Une conversation par contact (dossier) : dates de dernière lecture de chaque côté.
CREATE TABLE lead_conversation (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    owner_last_read_at TIMESTAMP,
    prospect_last_read_at TIMESTAMP,
    owner_alerted_at TIMESTAMP,
    prospect_alerted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_lead_conversation_dossier UNIQUE (dossier_id),
    CONSTRAINT fk_lead_conversation_dossier FOREIGN KEY (dossier_id) REFERENCES dossier (id) ON DELETE CASCADE
);

CREATE INDEX idx_lead_conversation_org ON lead_conversation (org_id);

-- Liens d'accès du prospect (envoyés dans les alertes). Seule l'empreinte SHA-256 est stockée.
CREATE TABLE lead_conversation_link (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,
    revoked_at TIMESTAMP,
    CONSTRAINT uk_lead_conversation_link_token UNIQUE (token_hash),
    CONSTRAINT fk_lead_conversation_link_conv FOREIGN KEY (conversation_id) REFERENCES lead_conversation (id) ON DELETE CASCADE
);

-- Créneaux de visite proposés par le propriétaire ; le prospect en choisit un.
CREATE TABLE visit_proposal (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    batch_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    appointment_id BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_visit_proposal_dossier FOREIGN KEY (dossier_id) REFERENCES dossier (id) ON DELETE CASCADE
);

CREATE INDEX idx_visit_proposal_dossier ON visit_proposal (dossier_id, status);
