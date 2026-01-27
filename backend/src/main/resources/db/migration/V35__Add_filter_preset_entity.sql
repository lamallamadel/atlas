-- Filter Preset Entity for saving and sharing advanced filter configurations
-- Using ${json_type} placeholder: JSONB for PostgreSQL, JSON for H2
CREATE TABLE filter_preset (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    filter_type VARCHAR(50) NOT NULL,
    description TEXT,
    filter_config ${json_type} NOT NULL,
    is_shared BOOLEAN DEFAULT false,
    is_predefined BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    org_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_filter_preset_name CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
);

CREATE INDEX idx_filter_preset_org_id ON filter_preset(org_id);
CREATE INDEX idx_filter_preset_created_by ON filter_preset(created_by);
CREATE INDEX idx_filter_preset_type ON filter_preset(filter_type);
CREATE INDEX idx_filter_preset_shared ON filter_preset(is_shared) WHERE is_shared = true;
CREATE INDEX idx_filter_preset_predefined ON filter_preset(is_predefined) WHERE is_predefined = true;

-- Insert predefined filter presets
INSERT INTO filter_preset (name, filter_type, description, filter_config, is_shared, is_predefined, org_id, created_by)
VALUES 
    ('Mes dossiers', 'DOSSIER', 'Dossiers assignés à moi', 
     '{"conditions":[{"field":"assignedTo","operator":"EQUALS_CURRENT_USER","value":""}],"logicOperator":"AND"}', 
     true, true, 'default', 'system'),
    
    ('Urgent', 'DOSSIER', 'Dossiers urgents nécessitant une action immédiate', 
     '{"conditions":[{"field":"status","operator":"IN","value":["NEW","QUALIFIED"]},{"field":"createdAt","operator":"LESS_THAN_DAYS_AGO","value":"2"}],"logicOperator":"AND"}', 
     true, true, 'default', 'system'),
    
    ('À traiter aujourd''hui', 'DOSSIER', 'Dossiers à traiter aujourd''hui', 
     '{"conditions":[{"field":"nextActionDate","operator":"EQUALS_TODAY","value":""},{"field":"status","operator":"NOT_IN","value":["WON","LOST"]}],"logicOperator":"AND"}', 
     true, true, 'default', 'system'),
    
    ('Nouveaux prospects', 'DOSSIER', 'Prospects créés dans les dernières 24h', 
     '{"conditions":[{"field":"status","operator":"EQUALS","value":"NEW"},{"field":"createdAt","operator":"LESS_THAN_DAYS_AGO","value":"1"}],"logicOperator":"AND"}', 
     true, true, 'default', 'system'),
    
    ('Rendez-vous cette semaine', 'DOSSIER', 'Dossiers avec rendez-vous planifiés cette semaine', 
     '{"conditions":[{"field":"hasAppointment","operator":"EQUALS","value":"true"},{"field":"appointmentDate","operator":"THIS_WEEK","value":""}],"logicOperator":"AND"}', 
     true, true, 'default', 'system');
