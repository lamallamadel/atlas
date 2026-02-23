-- V110: Enhance workflow system with versioning, templates, and simulation support
-- This migration refactors the workflow system to support comprehensive multi-tenant customization

-- Drop existing workflow tables to rebuild with enhanced schema
DROP TABLE IF EXISTS workflow_transition CASCADE;
DROP TABLE IF EXISTS workflow_definition CASCADE;

-- Create enhanced workflow_definition table with versioning and template support
CREATE TABLE workflow_definition (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    obj_name VARCHAR(255) NOT NULL,
    description TEXT,
    case_type VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_template BOOLEAN NOT NULL DEFAULT false,
    template_category VARCHAR(100),
    parent_version_id BIGINT REFERENCES workflow_definition(id),
    states_json ${json_type},
    transitions_json ${json_type},
    metadata_json ${json_type},
    initial_state VARCHAR(50),
    final_states VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_workflow_org_casetype_version UNIQUE (org_id, case_type, version)
);

-- Create workflow_state table for detailed state management
CREATE TABLE workflow_state (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    workflow_definition_id BIGINT NOT NULL REFERENCES workflow_definition(id) ON DELETE CASCADE,
    state_code VARCHAR(50) NOT NULL,
    state_name VARCHAR(255) NOT NULL,
    state_type VARCHAR(50),
    description TEXT,
    color VARCHAR(20),
    position_x INTEGER,
    position_y INTEGER,
    is_initial BOOLEAN NOT NULL DEFAULT false,
    is_final BOOLEAN NOT NULL DEFAULT false,
    metadata_json ${json_type},
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_workflow_state UNIQUE (workflow_definition_id, state_code)
);

-- Create workflow_transition_rule table for transition rules
CREATE TABLE workflow_transition_rule (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    workflow_definition_id BIGINT NOT NULL REFERENCES workflow_definition(id) ON DELETE CASCADE,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    label VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    required_fields ${json_type},
    field_validations ${json_type},
    allowed_roles ${json_type},
    conditions_json ${json_type},
    actions_json ${json_type},
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_workflow_transition UNIQUE (workflow_definition_id, from_state, to_state)
);

-- Recreate workflow_transition table for audit history
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
    transitioned_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create workflow_simulation table for testing workflows
CREATE TABLE workflow_simulation (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    workflow_definition_id BIGINT NOT NULL REFERENCES workflow_definition(id) ON DELETE CASCADE,
    simulation_name VARCHAR(255) NOT NULL,
    current_state VARCHAR(50) NOT NULL,
    test_data_json ${json_type},
    execution_log ${json_type},
    status_VARCHAR(50),
    result_json ${json_type},
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Add workflow reference fields to dossier table
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS workflow_definition_id BIGINT REFERENCES workflow_definition(id);
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS workflow_version INTEGER;

-- Create indexes for performance
CREATE INDEX idx_workflow_definition_org_casetype ON workflow_definition(org_id, case_type);
CREATE INDEX idx_workflow_definition_active ON workflow_definition(org_id, is_active, is_published) WHERE is_active = true;
CREATE INDEX idx_workflow_definition_template ON workflow_definition(is_template, template_category) WHERE is_template = true;
CREATE INDEX idx_workflow_definition_parent ON workflow_definition(parent_version_id) WHERE parent_version_id IS NOT NULL;

CREATE INDEX idx_workflow_state_workflow ON workflow_state(workflow_definition_id);
CREATE INDEX idx_workflow_state_code ON workflow_state(workflow_definition_id, state_code);

CREATE INDEX idx_workflow_transition_rule_workflow ON workflow_transition_rule(workflow_definition_id);
CREATE INDEX idx_workflow_transition_rule_from ON workflow_transition_rule(workflow_definition_id, from_state) WHERE is_active = true;

CREATE INDEX idx_workflow_transition_dossier ON workflow_transition(dossier_id);
CREATE INDEX idx_workflow_transition_org_casetype ON workflow_transition(org_id, case_type);
CREATE INDEX idx_workflow_transition_timestamp ON workflow_transition(transitioned_at DESC);

CREATE INDEX idx_workflow_simulation_workflow ON workflow_simulation(workflow_definition_id);
CREATE INDEX idx_workflow_simulation_org ON workflow_simulation(org_id);

CREATE INDEX idx_dossier_workflow ON dossier(workflow_definition_id) WHERE workflow_definition_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE workflow_definition IS 'Stores workflow definitions with versioning support';
COMMENT ON TABLE workflow_state IS 'Stores individual states within workflows';
COMMENT ON TABLE workflow_transition_rule IS 'Stores transition rules with validations and role-based access';
COMMENT ON TABLE workflow_transition IS 'Audit log of all workflow transition attempts';
COMMENT ON TABLE workflow_simulation IS 'Stores workflow simulation test results';

COMMENT ON COLUMN workflow_definition.version IS 'Version number for workflow, increments for each new version';
COMMENT ON COLUMN workflow_definition.is_published IS 'Published workflows are immutable';
COMMENT ON COLUMN workflow_definition.is_template IS 'System templates that can be instantiated by organizations';
COMMENT ON COLUMN workflow_definition.parent_version_id IS 'Reference to parent workflow when creating new version';
COMMENT ON COLUMN workflow_definition.states_json IS 'JSON array containing workflow state definitions';
COMMENT ON COLUMN workflow_definition.transitions_json IS 'JSON array containing workflow transitions';

COMMENT ON COLUMN workflow_transition_rule.required_fields IS 'JSON array of field names required for transition';
COMMENT ON COLUMN workflow_transition_rule.field_validations IS 'JSON object with field-level validation rules';
COMMENT ON COLUMN workflow_transition_rule.allowed_roles IS 'JSON array of roles permitted to execute transition';
COMMENT ON COLUMN workflow_transition_rule.conditions_json IS 'JSON object with business logic conditions';
COMMENT ON COLUMN workflow_transition_rule.actions_json IS 'JSON array of actions to execute on transition';

COMMENT ON COLUMN dossier.workflow_definition_id IS 'References the workflow definition used by this dossier';
COMMENT ON COLUMN dossier.workflow_version IS 'Workflow version snapshot to maintain consistency during updates';


