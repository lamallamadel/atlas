-- Create task table
CREATE TABLE task (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT,
    assigned_to VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_task_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE,
    CONSTRAINT chk_task_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT chk_task_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- Create indexes for task table
CREATE INDEX idx_task_org_id ON task(org_id);
CREATE INDEX idx_task_dossier_id ON task(dossier_id);
CREATE INDEX idx_task_assigned_to ON task(assigned_to);
CREATE INDEX idx_task_due_date ON task(due_date);
CREATE INDEX idx_task_status ON task(status_);
CREATE INDEX idx_task_priority ON task(priority);
CREATE INDEX idx_task_assigned_to_status ON task(assigned_to, status);
CREATE INDEX idx_task_due_date_status ON task(due_date, status);


