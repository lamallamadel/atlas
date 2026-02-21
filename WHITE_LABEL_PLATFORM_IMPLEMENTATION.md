# White-Label Multi-Organization Platform Implementation

## Overview
Complete implementation of a white-label multi-organization SaaS platform for Atlas Immobilier, enabling tenant-specific branding, automated provisioning, usage-based billing, and GDPR-compliant data exports.

## Architecture Components

### 1. Database Schema (V114__Add_white_label_multi_org_platform.sql)

#### Tables Created:
- **white_label_config**: Stores org-specific branding (logo URLs, colors, custom CSS, email branding)
- **tenant_provisioning**: Tracks automated tenant setup process with progress tracking
- **tenant_usage**: Records message volumes and storage usage for billing
- **stripe_subscription**: Manages Stripe subscription integration and billing cycles
- **data_export_request**: Handles GDPR data portability requests with secure downloads
- **custom_domain_mapping**: Maps custom domains with Let's Encrypt SSL provisioning
- **tenant_onboarding**: Tracks user onboarding progress through wizard steps
- **feature_flag**: Manages tenant-specific feature flags and plan restrictions

### 2. Backend Entities

#### Core Entities:
- `WhiteLabelConfigEntity`: Branding configuration per tenant
- `TenantProvisioningEntity`: Provisioning status and configuration
- `TenantUsageEntity`: Usage tracking for billing
- `StripeSubscriptionEntity`: Subscription management
- `DataExportRequestEntity`: GDPR export requests
- `CustomDomainMappingEntity`: Custom domain configuration
- `TenantOnboardingEntity`: Onboarding wizard progress
- `FeatureFlagEntity`: Feature flag management

### 3. Repositories

All entities have corresponding JPA repositories with custom query methods:
- `WhiteLabelConfigRepository`
- `TenantProvisioningRepository`
- `TenantUsageRepository`
- `StripeSubscriptionRepository`
- `DataExportRequestRepository`
- `CustomDomainMappingRepository`
- `TenantOnboardingRepository`
- `FeatureFlagRepository`

### 4. Services

#### TenantProvisioningService
Automated tenant setup with:
- Database schema initialization
- Default referentials seeding
- Admin user creation
- Branding configuration
- Feature flags initialization
- Sample data generation
- Progress tracking (0-100%)

**Key Methods:**
```java
TenantProvisioningEntity initiateTenantProvisioning(...)
void provisionTenant(String orgId)
Optional<TenantProvisioningEntity> getProvisioningStatus(String orgId)
```

#### DynamicThemeService
Runtime theme loading based on X-Org-Id header:
- CSS custom properties generation
- Tenant-specific color schemes
- Logo and branding assets
- Caching for performance

**Key Methods:**
```java
Map<String, String> getTenantTheme(String orgId)
Map<String, String> getCurrentTenantTheme()
String generateCssProperties(Map<String, String> theme)
```

#### WhiteLabelService
Manages white-label configuration:
- CRUD operations for branding
- SSL certificate tracking
- Feature flag updates
- Domain mapping

**Key Methods:**
```java
WhiteLabelConfigEntity getConfig(String orgId)
WhiteLabelConfigEntity createOrUpdate(String orgId, WhiteLabelConfigEntity config)
void updateSslCertificate(String orgId, String status, LocalDateTime issuedAt, LocalDateTime expiresAt)
```

#### StripeIntegrationService
Usage-based billing with Stripe:
- Subscription creation with plan tiers (starter, professional, enterprise)
- Webhook handling (subscription updates, payment events)
- Monthly bill calculation with overages
- Message volume and storage tracking

**Pricing Structure:**
- **Starter**: $29/month, 1,000 messages, 10GB, 5 users
- **Professional**: $99/month, 10,000 messages, 50GB, 20 users
- **Enterprise**: $299/month, 100,000 messages, 500GB, unlimited users

**Key Methods:**
```java
StripeSubscriptionEntity createSubscription(String orgId, String planTier, String billingPeriod, String customerEmail)
void handleWebhook(String eventType, Map<String, Object> data)
Map<String, Object> calculateMonthlyBill(String orgId)
```

#### TenantUsageTrackingService
Real-time usage tracking:
- Message sent tracking (email, SMS, WhatsApp)
- Storage usage monitoring
- API call counting
- Dossier creation tracking
- Monthly usage reports

**Key Methods:**
```java
void trackMessageSent(String orgId, String channel)
void trackStorageUsage(String orgId, long documentBytes, long attachmentBytes)
Map<String, Object> getCurrentPeriodUsage(String orgId)
```

#### DataExportService
GDPR-compliant data exports:
- Full tenant data export in JSON/CSV/XML formats
- Document inclusion options
- Audit log export
- Secure download links with expiration
- Download count limits (default: 3)
- 7-day expiration on download URLs

**Key Methods:**
```java
DataExportRequestEntity createExportRequest(...)
@Async void processExportRequest(Long requestId)
void incrementDownloadCount(Long requestId)
```

#### CustomDomainService
Custom domain mapping with SSL:
- DNS verification (CNAME and TXT records)
- Let's Encrypt SSL certificate provisioning
- Automatic certificate renewal (30 days before expiration)
- Primary domain management
- Domain status tracking

**Key Methods:**
```java
CustomDomainMappingEntity addCustomDomain(String orgId, String domain, boolean isPrimary)
boolean verifyDnsConfiguration(String domain)
void renewExpiringCertificates()
```

### 5. Controllers

#### WhiteLabelAdminController (Super-Admin Only)
`@PreAuthorize("hasRole('SUPER_ADMIN')")`

**Endpoints:**
- `GET /api/v1/admin/white-label/{orgId}` - Get white-label config
- `PUT /api/v1/admin/white-label/{orgId}` - Update white-label config
- `GET /api/v1/admin/white-label/{orgId}/theme` - Get theme CSS properties
- `GET /api/v1/admin/white-label/{orgId}/theme/css` - Get theme as CSS file
- `GET /api/v1/admin/white-label/{orgId}/features` - Get feature flags
- `PUT /api/v1/admin/white-label/{orgId}/features/{featureKey}` - Toggle feature flag

#### TenantProvisioningController (Super-Admin Only)
**Endpoints:**
- `POST /api/v1/admin/provisioning/initiate` - Initiate tenant provisioning
- `POST /api/v1/admin/provisioning/{orgId}/provision` - Execute provisioning
- `GET /api/v1/admin/provisioning/{orgId}/status` - Get provisioning status

#### BillingController
**Endpoints:**
- `GET /api/v1/billing/subscription` - Get current subscription
- `POST /api/v1/billing/subscription/create` - Create subscription
- `GET /api/v1/billing/usage/current` - Get current period usage
- `GET /api/v1/billing/usage/history` - Get usage history
- `GET /api/v1/billing/estimate` - Calculate estimated bill
- `POST /api/v1/billing/webhook` - Stripe webhook endpoint

#### DataExportController
**Endpoints:**
- `POST /api/v1/data-export/request` - Request GDPR data export
- `GET /api/v1/data-export/requests` - Get all export requests
- `GET /api/v1/data-export/requests/{id}` - Get export request status
- `GET /api/v1/data-export/download/{id}` - Download exported data

#### CustomDomainController (Admin Only)
**Endpoints:**
- `GET /api/v1/custom-domains` - Get all custom domains
- `POST /api/v1/custom-domains` - Add custom domain
- `POST /api/v1/custom-domains/{domain}/verify` - Verify DNS and provision SSL
- `DELETE /api/v1/custom-domains/{domain}` - Remove custom domain
- `GET /api/v1/custom-domains/{domain}` - Get domain details

#### TenantOnboardingController
**Endpoints:**
- `GET /api/v1/onboarding/progress` - Get onboarding progress
- `POST /api/v1/onboarding/step/{stepName}/complete` - Complete onboarding step
- `POST /api/v1/onboarding/skip` - Skip onboarding wizard

### 6. Frontend Services (Angular)

#### WhiteLabelService
- Theme loading and application
- Branding configuration management
- Feature flag toggling
- CSS custom properties injection

#### TenantProvisioningService
- Provisioning workflow management
- Status polling
- Progress tracking

#### BillingService
- Subscription management
- Usage monitoring
- Bill estimation

#### DataExportService
- Export request creation
- Status tracking
- Download management

## Implementation Features

### 1. Tenant-Specific Branding
- Custom logos (light and dark mode)
- Custom color schemes (primary, secondary, accent)
- Custom CSS overrides
- Favicon customization
- Email branding (from name, from address, footer HTML)

### 2. Automated Tenant Provisioning
Complete automated setup in 8 steps:
1. Database schema initialization (10%)
2. Default referentials seeding (25%)
3. Branding configuration (40%)
4. Organization settings (55%)
5. Feature flags initialization (70%)
6. Sample data generation (85%)
7. Admin user creation (95%)
8. Finalization (100%)

### 3. Usage-Based Billing with Stripe
- Plan tiers: Starter, Professional, Enterprise
- Included allowances per plan
- Overage pricing for messages and storage
- Real-time usage tracking
- Monthly bill estimation
- Webhook integration for subscription events

### 4. Custom Domain Mapping
- DNS verification (CNAME and TXT records)
- Automatic SSL certificate provisioning via Let's Encrypt
- Certificate auto-renewal (30 days before expiration)
- Primary domain management
- Status tracking: pending_verification → dns_pending → ssl_pending → active

### 5. GDPR Data Export
- Full data portability compliance
- Export formats: JSON, CSV, XML, ZIP
- Selective export (documents, audit logs)
- Secure download links with expiration (7 days)
- Download count limits (default: 3)
- Async processing for large exports

### 6. Tenant Onboarding Wizard
Progress tracked across 8 steps:
1. Welcome and profile setup
2. Branding configuration
3. First dossier creation
4. Team member invitation
5. Integration configuration
6. Workflow setup
7. Tutorial videos
8. Completion

### 7. Feature Flag Management
- Plan-based feature restrictions
- Per-tenant feature toggles
- Rollout percentage control
- User segment targeting
- Addon requirements

## Security Considerations

1. **Multi-Tenancy Isolation**: All queries filtered by orgId
2. **Role-Based Access Control**: Super-admin, Admin, User roles
3. **SSL Certificate Management**: Automatic provisioning and renewal
4. **Secure Downloads**: Expiring signed URLs, download limits
5. **Audit Logging**: All configuration changes logged
6. **Data Encryption**: Sensitive data encrypted at rest

## Performance Optimizations

1. **Caching**: Theme and branding configs cached per tenant
2. **Async Processing**: Data exports processed asynchronously
3. **Indexes**: Optimized indexes on orgId, status, dates
4. **Lazy Loading**: Theme loaded on-demand
5. **CDN Integration**: Static assets served via CDN

## Configuration

### Required Environment Variables
```properties
stripe.api.key=sk_test_...
letsencrypt.api.url=https://acme-v02.api.letsencrypt.org/directory
aws.s3.bucket=tenant-exports
```

### Application Properties
```yaml
spring:
  cache:
    type: caffeine
    cache-names: whiteLabelConfig, tenantTheme
  task:
    execution:
      pool:
        max-size: 10
```

## Usage Examples

### 1. Provision New Tenant
```bash
POST /api/v1/admin/provisioning/initiate
{
  "orgId": "acme-corp",
  "companyName": "Acme Corporation",
  "adminUserEmail": "admin@acme.com",
  "planTier": "professional",
  "includeSampleData": true
}

POST /api/v1/admin/provisioning/acme-corp/provision
```

### 2. Configure Branding
```bash
PUT /api/v1/admin/white-label/acme-corp
{
  "logoUrl": "https://cdn.acme.com/logo.png",
  "primaryColor": "#FF5722",
  "secondaryColor": "#212121",
  "accentColor": "#FFC107",
  "customDomain": "app.acme.com"
}
```

### 3. Add Custom Domain
```bash
POST /api/v1/custom-domains
{
  "domain": "app.acme.com",
  "isPrimary": true
}

POST /api/v1/custom-domains/app.acme.com/verify
```

### 4. Request GDPR Export
```bash
POST /api/v1/data-export/request
{
  "requestType": "full",
  "exportFormat": "json",
  "includeDocuments": true,
  "includeAuditLogs": true
}
```

### 5. Calculate Bill
```bash
GET /api/v1/billing/estimate
{
  "basePriceCents": 9900,
  "messageOverageCents": 250,
  "storageOverageCents": 60,
  "totalCents": 10210,
  "totalDollars": 102.10,
  "usedMessages": 10500,
  "overageMessages": 500
}
```

## Future Enhancements

1. **Multi-Region Support**: Deploy tenants in different geographic regions
2. **Advanced Analytics**: Tenant usage analytics dashboard
3. **White-Label Mobile Apps**: iOS and Android apps with tenant branding
4. **API Marketplace**: Third-party integration marketplace
5. **Advanced Billing**: Usage-based pricing for additional features
6. **Tenant Health Monitoring**: Real-time tenant health dashboard
7. **Automated Scaling**: Auto-scale resources based on tenant usage
8. **Compliance Certifications**: SOC 2, ISO 27001, HIPAA compliance

## Testing

### Unit Tests
Run unit tests for all services:
```bash
mvn test
```

### Integration Tests
Test provisioning flow:
```bash
mvn verify -Pbackend-e2e-postgres
```

### E2E Tests
Full white-label platform E2E tests:
```bash
npm run e2e:full
```

## Deployment

### Database Migration
```bash
mvn flyway:migrate
```

### Application Startup
```bash
mvn spring-boot:run
```

### Production Deployment
```bash
mvn clean package
java -jar target/backend.jar --spring.profiles.active=prod
```

## Monitoring

Key metrics to monitor:
- Tenant provisioning success rate
- SSL certificate renewal success rate
- Data export processing time
- Billing calculation accuracy
- API response times per tenant
- Usage tracking accuracy

## Support

For questions or issues:
- Documentation: `/docs/white-label-platform.md`
- API Documentation: `http://localhost:8080/swagger-ui.html`
- Support: support@atlas-crm.com
