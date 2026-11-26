-- Cas d'usage n°1, lot C : score agences ↔ demande, invitations, avis, fin de mandat, alertes.

-- Agences rapprochées d'une demande : recommandées par le score (MATCHED, les 10 meilleures à
-- l'ouverture) ou invitées par le propriétaire (INVITED).
CREATE TABLE mandate_invitation (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    agency_org_id VARCHAR(255) NOT NULL,
    kind VARCHAR(16) NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    seen_at TIMESTAMP,
    CONSTRAINT uk_mandate_invitation UNIQUE (request_id, agency_org_id),
    CONSTRAINT fk_mandate_invitation_request FOREIGN KEY (request_id) REFERENCES mandate_request (id)
);

CREATE INDEX idx_mandate_invitation_agency ON mandate_invitation (agency_org_id, created_at);

-- Avis vérifié du propriétaire sur l'agence, un par mandat terminé (R-PROP-13).
CREATE TABLE agency_review (
    id BIGSERIAL PRIMARY KEY,
    mandate_id BIGINT NOT NULL,
    owner_org_id VARCHAR(255) NOT NULL,
    agency_org_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL,
    comment VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_agency_review_mandate UNIQUE (mandate_id),
    CONSTRAINT fk_agency_review_mandate FOREIGN KEY (mandate_id) REFERENCES mandate (id)
);

CREATE INDEX idx_agency_review_agency ON agency_review (agency_org_id);

-- Qui a terminé le mandat ; alertes déjà envoyées (échéance à J-15, demande sans proposition).
ALTER TABLE mandate ADD COLUMN ended_by VARCHAR(8);
ALTER TABLE mandate ADD COLUMN expiry_alerted_at TIMESTAMP;
ALTER TABLE mandate_request ADD COLUMN idle_alerted_at TIMESTAMP;
