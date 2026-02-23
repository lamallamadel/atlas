-- White-Label Multi-Organization Platform
-- Enables SaaS business model with tenant-specific branding, provisioning, and billing

-- 1. White-Label Configuration Entity
CREATE TABLE white_label_config (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    
    -- Branding
    logo_url VARCHAR(500),
    logo_url_dark VARCHAR(500),
    favicon_url VARCHAR(500),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    custom_css TEXT,
    
    -- Custom Domain
    custom_domain VARCHAR(255),
    ssl_certificate_status VARCHAR(50) DEFAULT 'pending',
    ssl_certificate_issued_at TIMESTAMP,
    ssl_certificate_expires_at TIMESTAMP,
    
    -- Email Branding
    email_from_name VARCHAR(255),
    email_from_address VARCHAR(255),
    email_footer_html TEXT,
    
    -- Feature Flags
    features ${json_type},
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT uk_white_label_org_id UNIQUE (org_id),
    CONSTRAINT uk_white_label_custom_domain UNIQUE (custom_domain)
);

CREATE INDEX idx_white_label_org_id ON white_label_config(org_id);
CREATE INDEX idx_white_label_custom_domain ON white_label_config(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_white_label_ssl_status ON white_label_config(ssl_certificate_status);

-- 2. Tenant Provisioning Tracking
CREATE TABLE tenant_provisioning (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    
    -- Provisioning Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    provisioning_step VARCHAR(100),
    progress_percent INTEGER DEFAULT 0,
    
    -- Configuration
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'starter',
    admin_user_email VARCHAR(255) NOT NULL,
    admin_user_name VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    
    -- Sample Data
    include_sample_data BOOLEAN DEFAULT true,
    sample_data_generated BOOLEAN DEFAULT false,
    
    -- Provisioning Details
    provisioning_started_at TIMESTAMP,
    provisioning_completed_at TIMESTAMP,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_tenant_provisioning_org_id UNIQUE (org_id)
);

CREATE INDEX idx_tenant_provisioning_status ON tenant_provisioning(status_);
CREATE INDEX idx_tenant_provisioning_email ON tenant_provisioning(admin_user_email);

-- 3. Tenant Usage Tracking (for Billing)
CREATE TABLE tenant_usage (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    
    -- Usage Period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- Message Volumes
    email_messages_sent INTEGER DEFAULT 0,
    sms_messages_sent INTEGER DEFAULT 0,
    whatsapp_messages_sent INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    
    -- Storage Usage (bytes)
    documents_storage_bytes BIGINT DEFAULT 0,
    attachments_storage_bytes BIGINT DEFAULT 0,
    total_storage_bytes BIGINT DEFAULT 0,
    
    -- Activity Metrics
    active_users INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    dossiers_created INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_tenant_usage_org_period UNIQUE (org_id, period_start)
);

CREATE INDEX idx_tenant_usage_org_id ON tenant_usage(org_id);
CREATE INDEX idx_tenant_usage_period ON tenant_usage(period_start, period_end);

-- 4. Stripe Subscription Integration
CREATE TABLE stripe_subscription (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    
    -- Stripe IDs
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) NOT NULL,
    stripe_price_id VARCHAR(255),
    
    -- Subscription Details
    status VARCHAR(50) NOT NULL,
    plan_tier VARCHAR(50) NOT NULL,
    billing_period VARCHAR(20) DEFAULT 'monthly',
    
    -- Pricing
    base_price_cents INTEGER,
    message_overage_price_cents INTEGER,
    storage_overage_price_cents INTEGER,
    
    -- Usage Limits
    included_messages INTEGER,
    included_storage_gb INTEGER,
    max_users INTEGER,
    
    -- Billing Dates
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    cancel_at TIMESTAMP,
    canceled_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Payment Status
    last_payment_status VARCHAR(50),
    last_payment_at TIMESTAMP,
    next_billing_date TIMESTAMP,
    
    -- Metadata
    metadata ${json_type},
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_stripe_subscription_org_id UNIQUE (org_id),
    CONSTRAINT uk_stripe_customer_id UNIQUE (stripe_customer_id),
    CONSTRAINT uk_stripe_subscription_id UNIQUE (stripe_subscription_id)
);

CREATE INDEX idx_stripe_subscription_org_id ON stripe_subscription(org_id);
CREATE INDEX idx_stripe_subscription_status ON stripe_subscription(status_);
CREATE INDEX idx_stripe_subscription_customer ON stripe_subscription(stripe_customer_id);
CREATE INDEX idx_stripe_subscription_next_billing ON stripe_subscription(next_billing_date);

-- 5. GDPR Data Export Requests
CREATE TABLE data_export_request (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    
    -- Request Details
    request_type VARCHAR(50) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_user_id VARCHAR(255),
    
    -- Export Configuration
    export_format VARCHAR(20) DEFAULT 'json',
    include_documents BOOLEAN DEFAULT true,
    include_audit_logs BOOLEAN DEFAULT false,
    
    -- Processing Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    
    -- Export Results
    export_file_path VARCHAR(500),
    export_file_size_bytes BIGINT,
    download_url VARCHAR(1000),
    download_url_expires_at TIMESTAMP,
    
    -- Security
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 3,
    
    -- Error Handling
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_export_format CHECK (export_format IN ('json', 'csv', 'xml', 'zip'))
);

CREATE INDEX idx_data_export_org_id ON data_export_request(org_id);
CREATE INDEX idx_data_export_status ON data_export_request(status_);
CREATE INDEX idx_data_export_requester ON data_export_request(requester_email);
CREATE INDEX idx_data_export_expires ON data_export_request(download_url_expires_at);

-- 6. Custom Domain Mapping
CREATE TABLE custom_domain_mapping (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    
    -- Domain Configuration
    domain VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    
    -- DNS Configuration
    dns_configured BOOLEAN DEFAULT false,
    dns_verified_at TIMESTAMP,
    cname_target VARCHAR(255),
    txt_verification_code VARCHAR(255),
    
    -- SSL Certificate
    ssl_enabled BOOLEAN DEFAULT false,
    ssl_provider VARCHAR(50) DEFAULT 'letsencrypt',
    ssl_certificate_arn VARCHAR(500),
    ssl_issued_at TIMESTAMP,
    ssl_expires_at TIMESTAMP,
    ssl_auto_renew BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
    last_verification_attempt TIMESTAMP,
    verification_attempts INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_custom_domain_domain UNIQUE (domain),
    CONSTRAINT chk_domain_status CHECK (status IN ('pending_verification', 'dns_pending', 'ssl_pending', 'active', 'failed', 'disabled'))
);

CREATE INDEX idx_custom_domain_org_id ON custom_domain_mapping(org_id);
CREATE INDEX idx_custom_domain_domain ON custom_domain_mapping(domain);
CREATE INDEX idx_custom_domain_status ON custom_domain_mapping(status_);
CREATE INDEX idx_custom_domain_primary ON custom_domain_mapping(org_id, is_primary) WHERE is_primary = true;

-- 7. Onboarding Progress Tracking
CREATE TABLE tenant_onboarding (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    
    -- Onboarding Steps
    completed_steps ${json_type},
    current_step VARCHAR(100),
    total_steps INTEGER DEFAULT 8,
    
    -- Progress
    progress_percent INTEGER DEFAULT 0,
    onboarding_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    onboarding_completed_at TIMESTAMP,
    
    -- Step Details
    profile_completed BOOLEAN DEFAULT false,
    branding_configured BOOLEAN DEFAULT false,
    first_dossier_created BOOLEAN DEFAULT false,
    team_member_invited BOOLEAN DEFAULT false,
    integration_configured BOOLEAN DEFAULT false,
    workflow_configured BOOLEAN DEFAULT false,
    
    -- Guidance
    dismissed_tooltips ${json_type},
    watched_tutorials ${json_type},
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_tenant_onboarding_org_user UNIQUE (org_id, user_id)
);

CREATE INDEX idx_tenant_onboarding_org_id ON tenant_onboarding(org_id);
CREATE INDEX idx_tenant_onboarding_user_id ON tenant_onboarding(user_id);
CREATE INDEX idx_tenant_onboarding_progress ON tenant_onboarding(progress_percent);
CREATE INDEX idx_tenant_onboarding_completed ON tenant_onboarding(onboarding_completed_at);

-- 8. Feature Flag Management
CREATE TABLE feature_flag (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    
    -- Feature Identification
    feature_key VARCHAR(100) NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    feature_description TEXT,
    
    -- Flag Status
    enabled BOOLEAN DEFAULT false,
    
    -- Plan Restrictions
    available_in_plans VARCHAR(255),
    requires_addon BOOLEAN DEFAULT false,
    
    -- Rollout Configuration
    rollout_percentage INTEGER DEFAULT 100,
    user_segments ${json_type},
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_feature_flag_org_key UNIQUE (org_id, feature_key),
    CONSTRAINT chk_rollout_percentage CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

CREATE INDEX idx_feature_flag_org_id ON feature_flag(org_id);
CREATE INDEX idx_feature_flag_key ON feature_flag(feature_key);
CREATE INDEX idx_feature_flag_enabled ON feature_flag(org_id, enabled);



