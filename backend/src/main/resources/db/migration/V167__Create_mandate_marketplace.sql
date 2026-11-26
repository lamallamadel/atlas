-- Cas d'usage n°1, lot B : bourse aux mandats. Les demandes, propositions, mandats et messages
-- relient une organisation de propriétaire et une agence : ils portent les deux identifiants et
-- n'utilisent pas le filtre d'organisation (accès vérifié par service, ADR 0005).

-- Profil public et zones d'intervention d'une agence.
CREATE TABLE agency_profile (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    languages VARCHAR(255),
    property_types VARCHAR(500),
    transactions VARCHAR(32),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_agency_profile_org UNIQUE (org_id)
);

CREATE TABLE agency_zone (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    city VARCHAR(120) NOT NULL,
    district VARCHAR(120),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_agency_zone_org ON agency_zone (org_id);
CREATE INDEX idx_agency_zone_city ON agency_zone (city);

-- Demande d'accompagnement d'un propriétaire, ouverte à la bourse ou adressée à une agence.
CREATE TABLE mandate_request (
    id BIGSERIAL PRIMARY KEY,
    owner_org_id VARCHAR(255) NOT NULL,
    property_id BIGINT NOT NULL,
    visibility VARCHAR(20) NOT NULL,
    target_agency_org_id VARCHAR(255),
    objective VARCHAR(8) NOT NULL,
    city VARCHAR(120) NOT NULL,
    district VARCHAR(120),
    expected_price NUMERIC(15, 2),
    currency VARCHAR(3),
    deadline VARCHAR(40),
    mandate_types VARCHAR(40) NOT NULL,
    services VARCHAR(500),
    commission_note VARCHAR(255),
    availability VARCHAR(255),
    languages VARCHAR(120),
    message VARCHAR(2000),
    status VARCHAR(20) NOT NULL,
    max_proposals INTEGER NOT NULL,
    opened_at TIMESTAMP,
    expires_at TIMESTAMP,
    target_declined_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_mandate_request_property FOREIGN KEY (property_id) REFERENCES property (id)
);

CREATE INDEX idx_mandate_request_owner ON mandate_request (owner_org_id);
CREATE INDEX idx_mandate_request_market ON mandate_request (status, visibility, city);
CREATE INDEX idx_mandate_request_target ON mandate_request (target_agency_org_id);

-- Proposition d'une agence sur une demande ; son fil de messages avec le propriétaire.
CREATE TABLE mandate_proposal (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    agency_org_id VARCHAR(255) NOT NULL,
    agent_user_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255),
    mandate_type VARCHAR(16) NOT NULL,
    duration_months INTEGER NOT NULL,
    commission_kind VARCHAR(16) NOT NULL,
    commission_value NUMERIC(15, 2) NOT NULL,
    commission_payer VARCHAR(16) NOT NULL,
    services VARCHAR(500),
    estimate_min NUMERIC(15, 2),
    estimate_max NUMERIC(15, 2),
    message VARCHAR(2000),
    status VARCHAR(20) NOT NULL,
    decided_at TIMESTAMP,
    owner_last_read_at TIMESTAMP,
    agency_last_read_at TIMESTAMP,
    owner_alerted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_mandate_proposal_agency UNIQUE (request_id, agency_org_id),
    CONSTRAINT fk_mandate_proposal_request FOREIGN KEY (request_id) REFERENCES mandate_request (id)
);

CREATE INDEX idx_mandate_proposal_agency ON mandate_proposal (agency_org_id, created_at);

CREATE TABLE marketplace_message (
    id BIGSERIAL PRIMARY KEY,
    proposal_id BIGINT NOT NULL,
    author_side VARCHAR(8) NOT NULL,
    author_user_id VARCHAR(255),
    author_name VARCHAR(255),
    body VARCHAR(4000) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_marketplace_message_proposal FOREIGN KEY (proposal_id) REFERENCES mandate_proposal (id)
);

CREATE INDEX idx_marketplace_message_proposal ON marketplace_message (proposal_id, created_at);

-- Mandat né d'une proposition acceptée ; dossier CRM_MANDATE_* côté agence.
CREATE TABLE mandate (
    id BIGSERIAL PRIMARY KEY,
    owner_org_id VARCHAR(255) NOT NULL,
    agency_org_id VARCHAR(255) NOT NULL,
    property_id BIGINT NOT NULL,
    request_id BIGINT NOT NULL,
    proposal_id BIGINT NOT NULL,
    agent_user_id VARCHAR(255),
    mandate_type VARCHAR(16) NOT NULL,
    duration_months INTEGER NOT NULL,
    commission_kind VARCHAR(16) NOT NULL,
    commission_value NUMERIC(15, 2) NOT NULL,
    commission_payer VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    signed_at TIMESTAMP,
    ended_at TIMESTAMP,
    end_reason VARCHAR(40),
    dossier_id BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_mandate_proposal UNIQUE (proposal_id)
);

CREATE INDEX idx_mandate_owner ON mandate (owner_org_id);
CREATE INDEX idx_mandate_agency ON mandate (agency_org_id);
CREATE INDEX idx_mandate_property ON mandate (property_id, status);
CREATE INDEX idx_mandate_dossier ON mandate (dossier_id);

-- Annonce publiée par une agence sous mandat.
ALTER TABLE annonce ADD COLUMN mandate_id BIGINT;
CREATE INDEX idx_annonce_mandate ON annonce (mandate_id);
