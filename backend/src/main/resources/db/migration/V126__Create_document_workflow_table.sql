CREATE TABLE document_workflow (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    document_id BIGINT NOT NULL,
    dossier_id BIGINT,
    template_id BIGINT,
    workflow_name VARCHAR(255) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    current_step_order INTEGER,
    workflow_config ${json_type},
    context_data ${json_type},
    initiated_by VARCHAR(255),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    property_value BIGINT,
    requires_additional_approval BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_document_workflow_document FOREIGN KEY (document_id) REFERENCES document(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_workflow_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE SET NULL,
    CONSTRAINT fk_document_workflow_template FOREIGN KEY (template_id) REFERENCES contract_template(id) ON DELETE SET NULL
);

CREATE INDEX idx_document_workflow_org_id ON document_workflow(org_id);
CREATE INDEX idx_document_workflow_document_id ON document_workflow(document_id);
CREATE INDEX idx_document_workflow_status ON document_workflow(status, org_id);
CREATE INDEX idx_document_workflow_started_at ON document_workflow(started_at);
