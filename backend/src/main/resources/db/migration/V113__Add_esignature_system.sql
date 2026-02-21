CREATE TABLE contract_template (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    description TEXT,
    signature_fields ${json_type},
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    docusign_template_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE signature_request (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    template_id BIGINT,
    envelope_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    signers ${json_type},
    subject VARCHAR(500),
    email_message TEXT,
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    signed_at TIMESTAMP,
    completed_at TIMESTAMP,
    declined_at TIMESTAMP,
    voided_at TIMESTAMP,
    declined_reason VARCHAR(1000),
    voided_reason VARCHAR(1000),
    signed_document_id BIGINT,
    certificate_path VARCHAR(1000),
    audit_trail ${json_type},
    workflow_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_signature_request_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE,
    CONSTRAINT fk_signature_request_template FOREIGN KEY (template_id) REFERENCES contract_template(id) ON DELETE SET NULL,
    CONSTRAINT fk_signature_request_document FOREIGN KEY (signed_document_id) REFERENCES document(id) ON DELETE SET NULL
);

CREATE INDEX idx_contract_template_org_id ON contract_template(org_id);
CREATE INDEX idx_contract_template_org_active ON contract_template(org_id, is_active);
CREATE INDEX idx_contract_template_type ON contract_template(org_id, template_type);

CREATE INDEX idx_signature_request_org_id ON signature_request(org_id);
CREATE INDEX idx_signature_request_dossier ON signature_request(dossier_id, org_id);
CREATE INDEX idx_signature_request_envelope ON signature_request(envelope_id, org_id);
CREATE INDEX idx_signature_request_status ON signature_request(org_id, status);
CREATE INDEX idx_signature_request_expires ON signature_request(expires_at) WHERE status IN ('PENDING', 'SENT', 'VIEWED');
