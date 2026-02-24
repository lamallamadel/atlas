CREATE TABLE document_audit (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    document_id BIGINT NOT NULL,
    workflow_id BIGINT,
    version_id BIGINT,
    action_type VARCHAR(50) NOT NULL,
    action_by VARCHAR(255) NOT NULL,
    action_at TIMESTAMP NOT NULL,
    description TEXT,
    metadata ${json_type},
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_document_audit_document FOREIGN KEY (document_id) REFERENCES document(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_audit_org_id ON document_audit(org_id);
CREATE INDEX idx_document_audit_document_id ON document_audit(document_id);
CREATE INDEX idx_document_audit_workflow_id ON document_audit(workflow_id);
CREATE INDEX idx_document_audit_action_at ON document_audit(action_at DESC);
