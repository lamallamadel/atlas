-- Workflow Template table for document workflow templates
CREATE TABLE workflow_template (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(50) NOT NULL,
    steps_definition ${json_type},
    default_config ${json_type},
    is_system_template BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    category VARCHAR(100),
    tags TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_workflow_template_org_id ON workflow_template(org_id);
CREATE INDEX idx_workflow_template_type ON workflow_template(workflow_type);
CREATE INDEX idx_workflow_template_active ON workflow_template(is_active);
