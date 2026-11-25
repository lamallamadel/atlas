-- Cas d'usage n°1, lot A : le bien d'un propriétaire, distinct de ses annonces. L'adresse précise
-- et le titre foncier restent privés (jamais exposés par le portail).
CREATE TABLE property (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    property_type VARCHAR(40),
    transaction_type VARCHAR(16) NOT NULL,
    city VARCHAR(120) NOT NULL,
    district VARCHAR(120),
    address VARCHAR(500),
    surface DOUBLE PRECISION,
    rooms INTEGER,
    expected_price NUMERIC(15, 2),
    currency VARCHAR(3),
    description VARCHAR(4000),
    land_title_number VARCHAR(64),
    verification_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_property_org ON property (org_id);

-- Qui publie l'annonce, quel bien elle diffuse, et la modération a priori des particuliers.
ALTER TABLE annonce ADD COLUMN property_id BIGINT;
ALTER TABLE annonce ADD COLUMN publisher_kind VARCHAR(16);
ALTER TABLE annonce ADD COLUMN moderation_status VARCHAR(20);
ALTER TABLE annonce ADD COLUMN moderation_note VARCHAR(1000);
ALTER TABLE annonce ADD COLUMN moderated_by VARCHAR(255);
ALTER TABLE annonce ADD COLUMN moderated_at TIMESTAMP;

CREATE INDEX idx_annonce_property ON annonce (property_id);
CREATE INDEX idx_annonce_moderation ON annonce (moderation_status);
