-- Create whatsapp_template table
CREATE TABLE whatsapp_template (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(512) NOT NULL,
    language VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    whatsapp_template_id VARCHAR(255),
    components ${json_type},
    description TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uq_whatsapp_template_org_name_lang UNIQUE (org_id, name, language)
);

-- Create template_variable table
CREATE TABLE template_variable (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    template_id BIGINT NOT NULL,
    variable_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    position INTEGER NOT NULL,
    example_value VARCHAR(1024),
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_template_variable_template FOREIGN KEY (template_id) REFERENCES whatsapp_template(id) ON DELETE CASCADE
);

-- Create indexes for whatsapp_template
CREATE INDEX idx_whatsapp_template_org_id ON whatsapp_template(org_id);
CREATE INDEX idx_whatsapp_template_status ON whatsapp_template(status);
CREATE INDEX idx_whatsapp_template_name ON whatsapp_template(name);
CREATE INDEX idx_whatsapp_template_language ON whatsapp_template(language);
CREATE INDEX idx_whatsapp_template_category ON whatsapp_template(category);

-- Create indexes for template_variable
CREATE INDEX idx_template_variable_org_id ON template_variable(org_id);
CREATE INDEX idx_template_variable_template_id ON template_variable(template_id);
CREATE INDEX idx_template_variable_component_type ON template_variable(component_type);
CREATE INDEX idx_template_variable_position ON template_variable(position);
