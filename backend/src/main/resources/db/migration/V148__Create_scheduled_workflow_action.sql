CREATE TABLE scheduled_workflow_action (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT,
    appointment_id BIGINT,
    run_at TIMESTAMP NOT NULL,
    action_config JSONB NOT NULL,
    user_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_scheduled_wf_run_at ON scheduled_workflow_action(run_at);
CREATE INDEX idx_scheduled_wf_org_id ON scheduled_workflow_action(org_id);
