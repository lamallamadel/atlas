-- Matching inverse : acheteurs (dossiers) dont les critères correspondent à une annonce.
-- Calculé à la création / modification de l'annonce et après l'analyse de ses photos.
CREATE TABLE annonce_dossier_match (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    annonce_id BIGINT NOT NULL,
    dossier_id BIGINT NOT NULL,
    score INTEGER NOT NULL,
    reasons ${json_type},
    alerts ${json_type},
    status VARCHAR(20) NOT NULL,
    notified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uq_annonce_dossier_match UNIQUE (annonce_id, dossier_id),
    CONSTRAINT fk_adm_annonce FOREIGN KEY (annonce_id) REFERENCES annonce(id) ON DELETE CASCADE,
    CONSTRAINT fk_adm_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

CREATE INDEX idx_adm_annonce ON annonce_dossier_match(annonce_id);
CREATE INDEX idx_adm_dossier ON annonce_dossier_match(dossier_id);
CREATE INDEX idx_adm_org ON annonce_dossier_match(org_id);
