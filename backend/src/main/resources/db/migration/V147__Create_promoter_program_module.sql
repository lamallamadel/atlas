-- Add virtual_tour_url to existing annonce table
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS virtual_tour_url VARCHAR(1000);

-- Create Real Estate Program table
CREATE TABLE real_estate_program (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(500),
    city VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, COMPLETED, CANCELLED
    delivery_date DATE,
    total_lots INTEGER DEFAULT 0,
    available_lots INTEGER DEFAULT 0,
    min_price DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'MAD',
    brochure_url VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_re_program_org_id ON real_estate_program(org_id);
CREATE INDEX idx_re_program_status ON real_estate_program(status);

-- Create Program Lot table
CREATE TABLE program_lot (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    program_id BIGINT NOT NULL,
    lot_number VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- APARTMENT, VILLA, COMMERCIAL, LAND
    surface DECIMAL(10, 2),
    floor_number INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    price DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, SOLD
    plan_image_url VARCHAR(1000),
    virtual_tour_url VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_program_lot_program FOREIGN KEY (program_id) REFERENCES real_estate_program(id) ON DELETE CASCADE
);

CREATE INDEX idx_prog_lot_org_id ON program_lot(org_id);
CREATE INDEX idx_prog_lot_program_id ON program_lot(program_id);
CREATE INDEX idx_prog_lot_status ON program_lot(status);

-- Create Lot Reservation table
CREATE TABLE lot_reservation (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    lot_id BIGINT NOT NULL,
    dossier_id BIGINT NOT NULL, -- Links to the Lead/Dossier
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED
    deposit_amount DECIMAL(15, 2),
    reservation_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP,
    contract_url VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_reservation_lot FOREIGN KEY (lot_id) REFERENCES program_lot(id),
    CONSTRAINT fk_reservation_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id)
);

CREATE INDEX idx_lot_res_org_id ON lot_reservation(org_id);
CREATE INDEX idx_lot_res_lot_id ON lot_reservation(lot_id);
CREATE INDEX idx_lot_res_dossier_id ON lot_reservation(dossier_id);
