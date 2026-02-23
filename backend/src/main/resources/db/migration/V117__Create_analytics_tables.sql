-- Analytics and BI Tables

-- Scheduled Reports
CREATE TABLE scheduled_report (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    obj_name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    report_type VARCHAR(100) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    format VARCHAR(50) NOT NULL,
    recipients ${json_type},
    parameters ${json_type},
    day_of_week VARCHAR(10),
    day_of_month INTEGER,
    hour INTEGER,
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    last_status VARCHAR(50),
    last_error VARCHAR(2000),
    run_count BIGINT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_scheduled_report_org_id ON scheduled_report(org_id);
CREATE INDEX idx_scheduled_report_next_run ON scheduled_report(next_run_at) WHERE enabled = true;
CREATE INDEX idx_scheduled_report_enabled ON scheduled_report(enabled);

-- Analytics Metrics (Data Warehouse)
CREATE TABLE analytics_metric (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    metric_date DATE NOT NULL,
    metric_value DECIMAL(20, 4),
    count_value BIGINT,
    dimensions ${json_type},
    metadata ${json_type},
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_metric_org_type_date ON analytics_metric(org_id, metric_type, metric_date);
CREATE INDEX idx_analytics_metric_date ON analytics_metric(metric_date);
CREATE INDEX idx_analytics_metric_category ON analytics_metric(category);

-- Custom Queries
CREATE TABLE custom_query (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    obj_name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    sql_query TEXT NOT NULL,
    parameters ${json_type},
    is_public BOOLEAN NOT NULL DEFAULT false,
    category VARCHAR(100),
    execution_count BIGINT DEFAULT 0,
    avg_execution_time_ms BIGINT,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    approved_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_custom_query_org_id ON custom_query(org_id);
CREATE INDEX idx_custom_query_approved ON custom_query(is_approved);
CREATE INDEX idx_custom_query_category ON custom_query(category);
CREATE INDEX idx_custom_query_public ON custom_query(is_public);

