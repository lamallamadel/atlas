-- Médias d'une annonce (photos importées dans Atlas ou liens externes)
-- et résultats de leur analyse visuelle par le brain (module vision).
CREATE TABLE annonce_media (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    annonce_id BIGINT NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    source VARCHAR(20) NOT NULL,
    storage_path VARCHAR(1000),
    external_url VARCHAR(1000),
    file_name VARCHAR(255),
    content_type VARCHAR(100),
    file_size BIGINT,
    position INTEGER NOT NULL DEFAULT 0,
    analysis_status VARCHAR(20) NOT NULL,
    analysis ${json_type},
    analysis_engine VARCHAR(20),
    analysis_error VARCHAR(500),
    analyzed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_annonce_media_annonce FOREIGN KEY (annonce_id) REFERENCES annonce(id) ON DELETE CASCADE
);

CREATE INDEX idx_annonce_media_annonce ON annonce_media(annonce_id);
CREATE INDEX idx_annonce_media_org ON annonce_media(org_id);

-- Profil agrégé : pièces, équipements, matériaux, mobilier, état, époque,
-- incohérences et description proposée (à valider par l'agent).
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS ai_vision_result ${json_type};
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS ai_vision_updated_at TIMESTAMP;
