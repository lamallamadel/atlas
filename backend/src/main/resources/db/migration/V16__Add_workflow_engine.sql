-- Add workflow engine tables

-- Workflow definition table: defines available status transitions per case type per tenant
CREATE TABLE workflow_definition (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    conditions_json ${json_type},
    required_fields_json ${json_type},
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uq_workflow_transition UNIQUE(org_id, case_type, from_status, to_status)
);

-- Workflow transition history table: tracks all attempted transitions and validations
CREATE TABLE workflow_transition (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    case_type VARCHAR(100),
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    is_allowed BOOLEAN NOT NULL,
    validation_errors_json ${json_type},
    user_id VARCHAR(255),
    reason TEXT,
    transitioned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_workflow_transition_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE
);

-- Indexes for workflow_definition
CREATE INDEX idx_workflow_definition_org_id ON workflow_definition(org_id);
CREATE INDEX idx_workflow_definition_case_type ON workflow_definition(case_type);
CREATE INDEX idx_workflow_definition_is_active ON workflow_definition(is_active);

-- Indexes for workflow_transition
CREATE INDEX idx_workflow_transition_org_id ON workflow_transition(org_id);
CREATE INDEX idx_workflow_transition_dossier_id ON workflow_transition(dossier_id);
CREATE INDEX idx_workflow_transition_transitioned_at ON workflow_transition(transitioned_at);
CREATE INDEX idx_workflow_transition_is_allowed ON workflow_transition(is_allowed);

-- Add missing columns to dossier table if they don't exist
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS case_type VARCHAR(100);
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS status_code VARCHAR(100);
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS loss_reason VARCHAR(100);
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS won_reason VARCHAR(100);

-- Create index for case_type
CREATE INDEX IF NOT EXISTS idx_dossier_case_type ON dossier(case_type);

