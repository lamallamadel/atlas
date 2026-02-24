CREATE TABLE document_version (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    document_id BIGINT NOT NULL,
    version_number INTEGER NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    content_type VARCHAR(255),
    checksum VARCHAR(64),
    version_notes TEXT,
    is_current BOOLEAN NOT NULL DEFAULT false,
    metadata ${json_type},
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_document_version_document FOREIGN KEY (document_id) REFERENCES document(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_version_org_id ON document_version(org_id);
CREATE INDEX idx_document_version_document_id ON document_version(document_id);
CREATE INDEX idx_document_version_is_current ON document_version(document_id, is_current);
