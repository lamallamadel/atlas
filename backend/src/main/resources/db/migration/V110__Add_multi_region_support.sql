-- Add region column to regional entities for data isolation
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'eu-west-1';
ALTER TABLE annonce ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'eu-west-1';
ALTER TABLE document ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'eu-west-1';
ALTER TABLE activity ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'eu-west-1';
ALTER TABLE audit_event ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'eu-west-1';

-- Add indexes for region-based queries
CREATE INDEX IF NOT EXISTS idx_dossier_region ON dossier(region);
CREATE INDEX IF NOT EXISTS idx_annonce_region ON annonce(region);
CREATE INDEX IF NOT EXISTS idx_document_region ON document(region);
CREATE INDEX IF NOT EXISTS idx_activity_region ON activity(region);
CREATE INDEX IF NOT EXISTS idx_audit_event_region ON audit_event(region);

-- Create replication conflict tracking table
CREATE TABLE IF NOT EXISTS replication_conflict (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    conflict_type VARCHAR(50) NOT NULL,
    source_region VARCHAR(50) NOT NULL,
    target_region VARCHAR(50) NOT NULL,
    conflict_data ${json_type},
    resolution_strategy VARCHAR(50),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_replication_conflict_table ON replication_conflict(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_replication_conflict_created ON replication_conflict(created_at);

-- Add version tracking for conflict resolution (last-write-wins)
ALTER TABLE organization ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1;
ALTER TABLE referential ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1;

-- Create trigger to increment version on update
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply version increment triggers to global entities
DROP TRIGGER IF EXISTS organization_version_trigger ON organization;
CREATE TRIGGER organization_version_trigger
    BEFORE UPDATE ON organization
    FOR EACH ROW
    EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS app_user_version_trigger ON app_user;
CREATE TRIGGER app_user_version_trigger
    BEFORE UPDATE ON app_user
    FOR EACH ROW
    EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS user_preferences_version_trigger ON user_preferences;
CREATE TRIGGER user_preferences_version_trigger
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS referential_version_trigger ON referential;
CREATE TRIGGER referential_version_trigger
    BEFORE UPDATE ON referential
    FOR EACH ROW
    EXECUTE FUNCTION increment_version();

-- Create region health monitoring table
CREATE TABLE IF NOT EXISTS region_health (
    id BIGSERIAL PRIMARY KEY,
    region VARCHAR(50) NOT NULL,
    status_VARCHAR(20) NOT NULL,
    latency_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    last_check TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata ${json_type}
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_region_health_region ON region_health(region);

-- Initialize region health data
INSERT INTO region_health (region, status, latency_ms, last_check)
VALUES 
    ('eu-west-1', 'UP', 0, CURRENT_TIMESTAMP),
    ('us-east-1', 'UP', 0, CURRENT_TIMESTAMP),
    ('ap-southeast-1', 'UP', 0, CURRENT_TIMESTAMP)
ON CONFLICT (region) DO NOTHING;

-- Create failover events table
CREATE TABLE IF NOT EXISTS failover_event (
    id BIGSERIAL PRIMARY KEY,
    source_region VARCHAR(50) NOT NULL,
    target_region VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    reason TEXT,
    initiated_by VARCHAR(100),
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata ${json_type}
);

CREATE INDEX IF NOT EXISTS idx_failover_event_created ON failover_event(created_at);
CREATE INDEX IF NOT EXISTS idx_failover_event_source ON failover_event(source_region);

