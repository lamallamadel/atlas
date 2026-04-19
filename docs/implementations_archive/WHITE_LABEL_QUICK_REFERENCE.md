# White-Label Platform - Quick Reference

## Quick Start

### 1. Database Setup
```bash
cd backend
mvn flyway:migrate
```

### 2. Provision First Tenant
```bash
curl -X POST http://localhost:8080/api/v1/admin/provisioning/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "demo-tenant",
    "companyName": "Demo Company",
    "adminUserEmail": "admin@demo.com",
    "planTier": "professional",
    "includeSampleData": true
  }'

curl -X POST http://localhost:8080/api/v1/admin/provisioning/demo-tenant/provision
```

### 3. Configure Branding
```bash
curl -X PUT http://localhost:8080/api/v1/admin/white-label/demo-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "primaryColor": "#FF5722",
    "secondaryColor": "#212121",
    "accentColor": "#FFC107",
    "logoUrl": "https://cdn.demo.com/logo.png"
  }'
```

## Key Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| WhiteLabelConfig | Tenant branding | logoUrl, primaryColor, customDomain |
| TenantProvisioning | Setup tracking | status, progressPercent, provisioningStep |
| TenantUsage | Usage metrics | totalMessages, totalStorageBytes |
| StripeSubscription | Billing | planTier, status, nextBillingDate |
| DataExportRequest | GDPR exports | status, downloadUrl, expiresAt |
| CustomDomainMapping | Custom domains | domain, status, sslEnabled |

## Common Operations

### Check Provisioning Status
```java
Optional<TenantProvisioningEntity> status = 
    provisioningService.getProvisioningStatus("demo-tenant");
```

### Load Tenant Theme
```java
Map<String, String> theme = themeService.getTenantTheme("demo-tenant");
```

### Track Message Sent
```java
usageService.trackMessageSent("demo-tenant", "whatsapp");
```

### Calculate Bill
```java
Map<String, Object> bill = stripeService.calculateMonthlyBill("demo-tenant");
```

### Request Data Export
```java
DataExportRequestEntity request = exportService.createExportRequest(
    "demo-tenant", "full", "user@demo.com", "user123", 
    "json", true, false
);
```

### Add Custom Domain
```java
CustomDomainMappingEntity domain = 
    domainService.addCustomDomain("demo-tenant", "app.demo.com", true);
boolean verified = domainService.verifyDnsConfiguration("app.demo.com");
```

## Plan Tiers

| Tier | Price | Messages | Storage | Users | Overage (msg) | Overage (GB) |
|------|-------|----------|---------|-------|---------------|--------------|
| Starter | $29/mo | 1,000 | 10GB | 5 | $0.10 | $0.50 |
| Professional | $99/mo | 10,000 | 50GB | 20 | $0.05 | $0.30 |
| Enterprise | $299/mo | 100,000 | 500GB | ∞ | $0.02 | $0.20 |

## Feature Flags

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| whatsapp_integration | ❌ | ✅ | ✅ |
| advanced_analytics | ❌ | ❌ | ✅ |
| custom_branding | ❌ | ✅ | ✅ |
| api_access | ❌ | ✅ | ✅ |
| workflow_automation | ❌ | ✅ | ✅ |

## API Quick Reference

### Provisioning
```
POST   /api/v1/admin/provisioning/initiate
POST   /api/v1/admin/provisioning/{orgId}/provision
GET    /api/v1/admin/provisioning/{orgId}/status
```

### Branding
```
GET    /api/v1/admin/white-label/{orgId}
PUT    /api/v1/admin/white-label/{orgId}
GET    /api/v1/admin/white-label/{orgId}/theme
GET    /api/v1/admin/white-label/{orgId}/features
```

### Billing
```
GET    /api/v1/billing/subscription
GET    /api/v1/billing/usage/current
GET    /api/v1/billing/estimate
```

### Data Export
```
POST   /api/v1/data-export/request
GET    /api/v1/data-export/requests
GET    /api/v1/data-export/download/{id}
```

### Custom Domains
```
POST   /api/v1/custom-domains
POST   /api/v1/custom-domains/{domain}/verify
GET    /api/v1/custom-domains
```

## Database Tables

```sql
-- Core tables
white_label_config       -- Branding per tenant
tenant_provisioning      -- Setup tracking
tenant_usage            -- Usage metrics
stripe_subscription     -- Billing
data_export_request     -- GDPR exports
custom_domain_mapping   -- Custom domains
tenant_onboarding       -- Onboarding wizard
feature_flag           -- Feature flags
```

## Files Created

**Backend (30+ files)**
- 8 Entities
- 8 Repositories
- 6 Services
- 6 Controllers
- 1 Migration

**Frontend (4 files)**
- 4 Angular Services

**Documentation (3 files)**
- Implementation Guide
- Summary
- Quick Reference

## Environment Variables

```properties
# Stripe
stripe.api.key=sk_test_...

# Let's Encrypt
letsencrypt.api.url=https://acme-v02.api.letsencrypt.org/directory

# AWS S3
aws.s3.bucket=tenant-exports

# Cache
spring.cache.type=caffeine
```

## Testing Commands

```bash
# Run all tests
mvn test

# Run E2E tests
mvn verify -Pbackend-e2e-postgres

# Validate migration
mvn flyway:validate

# Check migration status
mvn flyway:info
```

## Troubleshooting

### Provisioning Stuck
```java
// Check status
TenantProvisioningEntity status = 
    provisioningRepository.findByOrgId("demo-tenant").get();
System.out.println(status.getStatus() + " - " + status.getErrorMessage());
```

### Theme Not Loading
```java
// Verify config exists
Optional<WhiteLabelConfigEntity> config = 
    whiteLabelConfigRepository.findByOrgId("demo-tenant");
```

### Billing Calculation Wrong
```java
// Check usage
Map<String, Object> usage = 
    usageService.getCurrentPeriodUsage("demo-tenant");
System.out.println("Messages: " + usage.get("totalMessages"));
```

### Export Failed
```java
// Check export status
DataExportRequestEntity request = 
    exportRequestRepository.findById(requestId).get();
System.out.println(request.getStatus() + " - " + request.getErrorMessage());
```

## Support

- **Documentation**: `WHITE_LABEL_PLATFORM_IMPLEMENTATION.md`
- **API Docs**: `http://localhost:8080/swagger-ui.html`
- **Migration**: `backend/src/main/resources/db/migration/V114__Add_white_label_multi_org_platform.sql`
