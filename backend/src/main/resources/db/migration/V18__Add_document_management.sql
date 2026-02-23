-- Document management table
CREATE TABLE document (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    uploaded_by VARCHAR(255),
    content_type VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_document_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

-- Indexes on document
CREATE INDEX idx_document_org_id ON document(org_id);
CREATE INDEX idx_document_dossier_id ON document(dossier_id);
CREATE INDEX idx_document_created_at ON document(created_at);
CREATE INDEX idx_document_file_type ON document(file_type);


