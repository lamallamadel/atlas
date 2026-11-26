-- Cas d'usage n°1 (UC-P8) : offres transmises par l'agence mandatée et décision du propriétaire
-- (accepter, refuser, contre-proposer). Objet inter-organisations, comme le mandat (ADR 0005).
-- L'acquéreur reste anonyme : un profil court, jamais son nom ni ses coordonnées (R-PROP-12).
CREATE TABLE mandate_offer (
    id BIGSERIAL PRIMARY KEY,
    mandate_id BIGINT NOT NULL,
    owner_org_id VARCHAR(255) NOT NULL,
    agency_org_id VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    buyer_summary VARCHAR(255),
    conditions VARCHAR(1000),
    valid_until DATE,
    status VARCHAR(24) NOT NULL,
    counter_amount NUMERIC(15, 2),
    owner_comment VARCHAR(1000),
    created_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    decided_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_mandate_offer_mandate FOREIGN KEY (mandate_id) REFERENCES mandate (id)
);

CREATE INDEX idx_mandate_offer_mandate ON mandate_offer (mandate_id, created_at);
