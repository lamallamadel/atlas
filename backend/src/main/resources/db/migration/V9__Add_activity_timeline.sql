CREATE TABLE activity (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    obj_type VARCHAR(50) NOT NULL,
    content TEXT,
    dossier_id BIGINT NOT NULL,
    visibility VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_activity_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_org_id ON activity(org_id);
CREATE INDEX idx_activity_dossier_id ON activity(dossier_id);
CREATE INDEX idx_activity_created_at ON activity(created_at);
CREATE INDEX idx_activity_type ON activity(obj_type);
CREATE INDEX idx_activity_visibility ON activity(visibility);



