-- V43: Add user preferences and settings system
-- Description: Creates tables for user preferences, organization settings, and system configuration

-- User preferences table (renamed to avoid conflict with existing user_preferences)
CREATE TABLE user_preferences_v2 (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    preferences ${json_type},
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_preferences_v2_user_id UNIQUE (user_id)
);

-- Organization settings table
CREATE TABLE organization_settings (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    settings ${json_type},
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_organization_settings_org_id UNIQUE (org_id)
);

-- System configuration table
CREATE TABLE system_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL,
    config_value TEXT,
    category VARCHAR(100),
    encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_system_config_key UNIQUE (config_key)
);

-- Indexes for better query performance
CREATE INDEX idx_user_preferences_v2_user_id ON user_preferences_v2(user_id);
CREATE INDEX idx_organization_settings_org_id ON organization_settings(org_id);
CREATE INDEX idx_system_config_key ON system_config(config_key);
CREATE INDEX idx_system_config_category ON system_config(category);
