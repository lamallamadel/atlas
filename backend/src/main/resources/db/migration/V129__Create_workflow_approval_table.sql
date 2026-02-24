CREATE TABLE workflow_approval (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    workflow_id BIGINT NOT NULL,
    step_id BIGINT NOT NULL,
    approver_id VARCHAR(255) NOT NULL,
    approver_name VARCHAR(255),
    approver_email VARCHAR(255),
    decision VARCHAR(50),
    comments TEXT,
    reason TEXT,
    decided_at TIMESTAMP,
    notified_at TIMESTAMP,
    reminder_sent_at TIMESTAMP,
    reminder_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_workflow_approval_workflow FOREIGN KEY (workflow_id) REFERENCES document_workflow(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_approval_step FOREIGN KEY (step_id) REFERENCES workflow_step(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_approval_org_id ON workflow_approval(org_id);
CREATE INDEX idx_workflow_approval_workflow_id ON workflow_approval(workflow_id);
CREATE INDEX idx_workflow_approval_step_id ON workflow_approval(step_id);
CREATE INDEX idx_workflow_approval_approver ON workflow_approval(approver_id, org_id);
