-- Drop the existing appointment table to recreate with new schema
DROP TABLE IF EXISTS appointment CASCADE;

-- Create appointment table with new schema
CREATE TABLE appointment (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    dossier_id BIGINT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(500),
    assigned_to VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_appointment_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE,
    CONSTRAINT chk_appointment_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED'))
);

-- Create indexes for appointment table
CREATE INDEX idx_appointment_org_id ON appointment(org_id);
CREATE INDEX idx_appointment_dossier_id ON appointment(dossier_id);
CREATE INDEX idx_appointment_start_time ON appointment(start_time);
CREATE INDEX idx_appointment_assigned_to ON appointment(assigned_to);
CREATE INDEX idx_appointment_status ON appointment(status_);


