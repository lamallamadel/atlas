CREATE TABLE workflow_step (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    workflow_id BIGINT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_description TEXT,
    step_type VARCHAR(50) NOT NULL,
    step_order INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    assigned_approvers ${json_type},
    approvals_required INTEGER,
    approvals_received INTEGER DEFAULT 0,
    step_config ${json_type},
    condition_rules ${json_type},
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    is_parallel BOOLEAN NOT NULL DEFAULT false,
    requires_all_approvers BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_workflow_step_workflow FOREIGN KEY (workflow_id) REFERENCES document_workflow(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_step_org_id ON workflow_step(org_id);
CREATE INDEX idx_workflow_step_workflow_id ON workflow_step(workflow_id);
CREATE INDEX idx_workflow_step_status ON workflow_step(status, org_id);
