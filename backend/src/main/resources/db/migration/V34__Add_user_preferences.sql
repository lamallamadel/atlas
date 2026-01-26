-- V34: Add user preferences table for dashboard customization
-- Description: Creates user_preferences table to store dashboard layouts, widget settings, and general user preferences

CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    org_id VARCHAR(255) NOT NULL,
    dashboard_layout JSONB,
    widget_settings JSONB,
    general_preferences JSONB,
    theme VARCHAR(50),
    language VARCHAR(10),
    role_template VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_user_preferences_user_org UNIQUE (user_id, org_id)
);

-- Index for faster lookups by user and org
CREATE INDEX idx_user_preferences_user_org ON user_preferences(user_id, org_id);

-- Index for querying by role template
CREATE INDEX idx_user_preferences_role_template ON user_preferences(role_template) WHERE role_template IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE user_preferences IS 'Stores user-specific preferences including dashboard layouts and widget configurations';
COMMENT ON COLUMN user_preferences.user_id IS 'The ID of the user (from Keycloak or auth system)';
COMMENT ON COLUMN user_preferences.dashboard_layout IS 'JSON object containing widget positions and grid layout configuration';
COMMENT ON COLUMN user_preferences.widget_settings IS 'JSON object containing individual widget settings and data filters';
COMMENT ON COLUMN user_preferences.general_preferences IS 'JSON object for miscellaneous user preferences';
COMMENT ON COLUMN user_preferences.theme IS 'UI theme preference (light, dark, auto)';
COMMENT ON COLUMN user_preferences.language IS 'Preferred language code (fr, en, etc.)';
COMMENT ON COLUMN user_preferences.role_template IS 'Name of the applied role-based template (agent, manager, admin)';
