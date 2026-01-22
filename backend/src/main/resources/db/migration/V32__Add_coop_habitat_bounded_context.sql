-- Coop Habitat Bounded Context Migration

-- Coop Group table
CREATE TABLE coop_group (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    registration_number VARCHAR(100),
    address VARCHAR(500),
    city VARCHAR(255),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Coop Member table
CREATE TABLE coop_member (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    group_id BIGINT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(500),
    city VARCHAR(255),
    postal_code VARCHAR(20),
    date_of_birth DATE,
    member_number VARCHAR(100) UNIQUE,
    join_date DATE,
    status VARCHAR(50) NOT NULL,
    meta ${json_type},
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_coop_member_group FOREIGN KEY (group_id) REFERENCES coop_group(id) ON DELETE CASCADE
);

-- Coop Project table
CREATE TABLE coop_project (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    group_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(500),
    city VARCHAR(255),
    postal_code VARCHAR(20),
    status VARCHAR(50) NOT NULL,
    start_date DATE,
    expected_completion_date DATE,
    completion_date DATE,
    total_budget DECIMAL(15, 2),
    currency VARCHAR(3),
    meta JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_coop_project_group FOREIGN KEY (group_id) REFERENCES coop_group(id) ON DELETE CASCADE
);

-- Coop Lot table
CREATE TABLE coop_lot (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    project_id BIGINT NOT NULL,
    member_id BIGINT,
    lot_number VARCHAR(100) NOT NULL,
    description TEXT,
    surface_area DECIMAL(10, 2),
    floor_number INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    price DECIMAL(15, 2),
    currency VARCHAR(3),
    status VARCHAR(50) NOT NULL,
    meta JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_coop_lot_project FOREIGN KEY (project_id) REFERENCES coop_project(id) ON DELETE CASCADE,
    CONSTRAINT fk_coop_lot_member FOREIGN KEY (member_id) REFERENCES coop_member(id) ON DELETE SET NULL
);

-- Coop Contribution table
CREATE TABLE coop_contribution (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    member_id BIGINT NOT NULL,
    project_id BIGINT,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL,
    due_date DATE,
    payment_date DATE,
    reference_number VARCHAR(100),
    description TEXT,
    meta JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_coop_contribution_member FOREIGN KEY (member_id) REFERENCES coop_member(id) ON DELETE CASCADE,
    CONSTRAINT fk_coop_contribution_project FOREIGN KEY (project_id) REFERENCES coop_project(id) ON DELETE SET NULL
);

-- Indexes for coop_group
CREATE INDEX idx_coop_group_org_id ON coop_group(org_id);
CREATE INDEX idx_coop_group_created_at ON coop_group(created_at);

-- Indexes for coop_member
CREATE INDEX idx_coop_member_org_id ON coop_member(org_id);
CREATE INDEX idx_coop_member_group_id ON coop_member(group_id);
CREATE INDEX idx_coop_member_status ON coop_member(status);
CREATE INDEX idx_coop_member_email ON coop_member(email);
CREATE INDEX idx_coop_member_member_number ON coop_member(member_number);

-- Indexes for coop_project
CREATE INDEX idx_coop_project_org_id ON coop_project(org_id);
CREATE INDEX idx_coop_project_group_id ON coop_project(group_id);
CREATE INDEX idx_coop_project_status ON coop_project(status);
CREATE INDEX idx_coop_project_created_at ON coop_project(created_at);

-- Indexes for coop_lot
CREATE INDEX idx_coop_lot_org_id ON coop_lot(org_id);
CREATE INDEX idx_coop_lot_project_id ON coop_lot(project_id);
CREATE INDEX idx_coop_lot_member_id ON coop_lot(member_id);
CREATE INDEX idx_coop_lot_status ON coop_lot(status);

-- Indexes for coop_contribution
CREATE INDEX idx_coop_contribution_org_id ON coop_contribution(org_id);
CREATE INDEX idx_coop_contribution_member_id ON coop_contribution(member_id);
CREATE INDEX idx_coop_contribution_project_id ON coop_contribution(project_id);
CREATE INDEX idx_coop_contribution_status ON coop_contribution(status);
CREATE INDEX idx_coop_contribution_due_date ON coop_contribution(due_date);
CREATE INDEX idx_coop_contribution_type ON coop_contribution(type);
