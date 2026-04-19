# OrganizationSettingsService

Comprehensive tenant configuration management service for multi-tenant organization settings.

## Overview

The `OrganizationSettingsService` provides a centralized way to manage organization-level configuration across four main categories:

1. **BrandingSettings** - Visual identity (logo, colors, company name)
2. **IntegrationSettings** - Third-party integrations with encrypted credentials (WhatsApp, Email, SMS)
3. **WorkflowSettings** - Business logic configuration (enabled features, case types, status transitions)
4. **QuotaSettings** - Resource limits (max users, dossiers, storage, rate limits)

## Features

### Security
- ✅ **Admin-only modifications** - All write operations require `ROLE_ADMIN`
- ✅ **Encrypted credentials** - Integration credentials encrypted using Jasypt (PBEWITHHMACSHA512ANDAES_256)
- ✅ **Credential stripping** - Credentials not exposed in standard GET responses
- ✅ **Audit trail ready** - All modifications can be audited via Spring AOP

### Performance
- ✅ **L2 Redis caching** - 6-hour TTL for organization settings
- ✅ **Cache invalidation** - Automatic cache eviction on modifications
- ✅ **Optimistic locking** - Version field prevents concurrent modification conflicts

### Data Management
- ✅ **JSONB storage** - Settings stored as JSON in PostgreSQL for flexibility
- ✅ **Default values** - Sensible defaults for missing settings
- ✅ **Partial updates** - Update individual setting categories without affecting others
- ✅ **Validation** - JSR-303 validation on all DTOs

## API Endpoints

### Full Settings Management

#### Get Current Organization Settings
```http
GET /api/v1/organization-settings
```
Retrieves settings for the current organization from tenant context.

**Response:** `OrganizationSettingsResponse`

---

#### Get Organization Settings by ID
```http
GET /api/v1/organization-settings/{orgId}
```
**Auth:** Admin only

**Response:** `OrganizationSettingsResponse`

---

#### Create Organization Settings
```http
POST /api/v1/organization-settings/{orgId}
Content-Type: application/json

{
  "branding": { ... },
  "integrations": { ... },
  "workflow": { ... },
  "quotas": { ... }
}
```
**Auth:** Admin only

**Response:** `201 Created` with `OrganizationSettingsResponse`

---

#### Update Organization Settings
```http
PUT /api/v1/organization-settings/{orgId}
Content-Type: application/json

{
  "branding": { ... },
  "workflow": { ... }
}
```
**Auth:** Admin only

Partial updates allowed - only provided sections are updated.

**Response:** `200 OK` with `OrganizationSettingsResponse`

---

#### Delete Organization Settings
```http
DELETE /api/v1/organization-settings/{orgId}
```
**Auth:** Admin only

**Response:** `204 No Content`

---

### Branding Settings

#### Get Branding
```http
GET /api/v1/organization-settings/{orgId}/branding
```

**Response:**
```json
{
  "logo": "https://example.com/logo.png",
  "primaryColor": "#FF5733",
  "secondaryColor": "#33FF57",
  "companyName": "Acme Corporation"
}
```

---

#### Update Branding
```http
PUT /api/v1/organization-settings/{orgId}/branding
Content-Type: application/json

{
  "logo": "https://cdn.example.com/logo.png",
  "primaryColor": "#007bff",
  "secondaryColor": "#6c757d",
  "companyName": "Acme Corp"
}
```
**Auth:** Admin only

**Validation:**
- `companyName`: Required, max 255 chars
- `logo`: Max 1000 chars (URL)
- `primaryColor`, `secondaryColor`: Must be valid hex colors (e.g., `#FF5733`)

---

### Integration Settings

#### Get Integrations
```http
GET /api/v1/organization-settings/{orgId}/integrations
```
**Auth:** Admin only

Returns integration settings with **decrypted credentials**.

**Response:**
```json
{
  "whatsapp": {
    "enabled": true,
    "credentials": {
      "apiKey": "decrypted-api-key",
      "phoneNumberId": "123456789"
    },
    "config": {
      "webhookUrl": "https://api.example.com/webhook",
      "businessAccountId": "987654321"
    }
  },
  "email": {
    "enabled": true,
    "credentials": {
      "smtpUsername": "user@example.com",
      "smtpPassword": "decrypted-password"
    },
    "config": {
      "smtpHost": "smtp.example.com",
      "smtpPort": 587,
      "fromAddress": "noreply@example.com"
    }
  },
  "sms": {
    "enabled": false,
    "credentials": {},
    "config": {}
  }
}
```

---

#### Update Integrations
```http
PUT /api/v1/organization-settings/{orgId}/integrations
Content-Type: application/json

{
  "whatsapp": {
    "enabled": true,
    "credentials": {
      "apiKey": "your-api-key",
      "phoneNumberId": "123456789"
    },
    "config": {
      "webhookUrl": "https://api.example.com/webhook"
    }
  }
}
```
**Auth:** Admin only

Credentials are automatically **encrypted** before storage using Jasypt.

---

### Workflow Settings

#### Get Workflow
```http
GET /api/v1/organization-settings/{orgId}/workflow
```

**Response:**
```json
{
  "enabledFeatures": ["LEAD_SCORING", "AUTO_ASSIGNMENT", "EMAIL_TEMPLATES"],
  "defaultCaseTypes": ["VENTE", "LOCATION", "ESTIMATION"],
  "statusTransitionRules": {
    "NEW": ["IN_PROGRESS", "CANCELLED"],
    "IN_PROGRESS": ["QUALIFIED", "DISQUALIFIED", "CANCELLED"],
    "QUALIFIED": ["CONVERTED", "LOST"],
    "DISQUALIFIED": ["ARCHIVED"],
    "CONVERTED": ["CLOSED"],
    "LOST": ["ARCHIVED"],
    "CANCELLED": ["ARCHIVED"]
  }
}
```

---

#### Update Workflow
```http
PUT /api/v1/organization-settings/{orgId}/workflow
Content-Type: application/json

{
  "enabledFeatures": ["LEAD_SCORING", "AUTO_ASSIGNMENT"],
  "defaultCaseTypes": ["VENTE", "LOCATION"],
  "statusTransitionRules": {
    "NEW": ["IN_PROGRESS"],
    "IN_PROGRESS": ["QUALIFIED", "DISQUALIFIED"]
  }
}
```
**Auth:** Admin only

**Validation:**
- `enabledFeatures`: Required (can be empty list)
- `defaultCaseTypes`: Required (can be empty list)
- `statusTransitionRules`: Required (can be empty map)

---

### Quota Settings

#### Get Quotas
```http
GET /api/v1/organization-settings/{orgId}/quotas
```

**Response:**
```json
{
  "maxUsers": 50,
  "maxDossiers": 10000,
  "maxStorage": 52428800,
  "rateLimitTier": "PREMIUM"
}
```

---

#### Update Quotas
```http
PUT /api/v1/organization-settings/{orgId}/quotas
Content-Type: application/json

{
  "maxUsers": 100,
  "maxDossiers": 50000,
  "maxStorage": 104857600,
  "rateLimitTier": "ENTERPRISE"
}
```
**Auth:** Admin only

**Validation:**
- `maxUsers`: Required, minimum 1
- `maxDossiers`: Required, minimum 1
- `maxStorage`: Required, minimum 1 (in MB)
- `rateLimitTier`: Required string (e.g., "STANDARD", "PREMIUM", "ENTERPRISE")

---

## DTOs

### BrandingSettingsDto
```java
public class BrandingSettingsDto {
    @Size(max = 1000)
    private String logo;
    
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$")
    private String primaryColor;
    
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$")
    private String secondaryColor;
    
    @NotBlank
    @Size(max = 255)
    private String companyName;
}
```

### IntegrationSettingsDto
```java
public class IntegrationSettingsDto {
    @Valid
    private IntegrationCredentialsDto whatsapp;
    
    @Valid
    private IntegrationCredentialsDto email;
    
    @Valid
    private IntegrationCredentialsDto sms;
}

public class IntegrationCredentialsDto {
    private Boolean enabled;
    
    @JsonIgnore  // Never serialized in responses
    private Map<String, String> credentials;
    
    private Map<String, Object> config;
}
```

### WorkflowSettingsDto
```java
public class WorkflowSettingsDto {
    @NotNull
    private List<String> enabledFeatures;
    
    @NotNull
    private List<String> defaultCaseTypes;
    
    @NotNull
    private Map<String, List<String>> statusTransitionRules;
}
```

### QuotaSettingsDto
```java
public class QuotaSettingsDto {
    @NotNull
    @Min(1)
    private Integer maxUsers;
    
    @NotNull
    @Min(1)
    private Integer maxDossiers;
    
    @NotNull
    @Min(1)
    private Long maxStorage;  // in MB
    
    @NotBlank
    private String rateLimitTier;
}
```

---

## Service Methods

### Core Methods

```java
// Get settings
OrganizationSettingsResponse getSettings(String orgId)
OrganizationSettingsResponse getCurrentOrganizationSettings()

// Create/Update/Delete
OrganizationSettingsResponse createSettings(String orgId, OrganizationSettingsUpdateRequest request)
OrganizationSettingsResponse updateSettings(String orgId, OrganizationSettingsUpdateRequest request)
void deleteSettings(String orgId)

// Category-specific getters (admin validation varies)
BrandingSettingsDto getBranding(String orgId)
IntegrationSettingsDto getIntegrations(String orgId)  // Admin only, decrypted
WorkflowSettingsDto getWorkflow(String orgId)
QuotaSettingsDto getQuotas(String orgId)

// Category-specific updates (all admin only)
OrganizationSettingsResponse updateBranding(String orgId, BrandingSettingsDto branding)
OrganizationSettingsResponse updateIntegrations(String orgId, IntegrationSettingsDto integrations)
OrganizationSettingsResponse updateWorkflow(String orgId, WorkflowSettingsDto workflow)
OrganizationSettingsResponse updateQuotas(String orgId, QuotaSettingsDto quotas)
```

---

## Security

### Admin Validation
All modification methods validate admin access:
```java
private void validateAdminAccess() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    
    if (authentication == null || !authentication.isAuthenticated()) {
        throw new UnauthorizedAccessException("User is not authenticated");
    }

    boolean isAdmin = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(authority -> authority.equals("ROLE_ADMIN"));

    if (!isAdmin) {
        throw new UnauthorizedAccessException("Only administrators can modify organization settings");
    }
}
```

### Credential Encryption
Credentials are encrypted using Jasypt with the following config:
- **Algorithm:** PBEWITHHMACSHA512ANDAES_256
- **Key Iterations:** 1000
- **Salt:** Random (RandomSaltGenerator)
- **IV:** Random (RandomIvGenerator)
- **Output:** Base64

**Encryption flow:**
1. Admin provides credentials in plain text
2. Service encrypts each credential value
3. Encrypted values stored in database JSONB
4. Only admins can retrieve decrypted values

**Credential handling:**
- Regular GET responses strip credentials entirely
- Admin-only GET `/integrations` endpoint decrypts credentials
- Decryption errors return `***DECRYPTION_ERROR***` placeholder

---

## Caching

Settings are cached with Redis:
- **Cache Name:** `organizationSettings`
- **TTL:** 6 hours
- **Key Strategy:** 
  - By orgId: `{orgId}`
  - Current org: `current`

**Cache Invalidation:**
All write operations evict the entire cache:
```java
@CacheEvict(value = "organizationSettings", allEntries = true)
```

---

## Error Handling

### UnauthorizedAccessException
Thrown when non-admin attempts modification.

**HTTP Response:** `403 Forbidden`
```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "Only administrators can modify organization settings",
  "instance": "/api/v1/organization-settings/ORG-123"
}
```

### ResourceNotFoundException
Thrown when settings not found for orgId.

**HTTP Response:** `404 Not Found`
```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Organization settings not found for orgId: ORG-123",
  "instance": "/api/v1/organization-settings/ORG-123"
}
```

### Validation Errors
JSR-303 validation failures.

**HTTP Response:** `400 Bad Request`
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Primary color must be a valid hex color (e.g., #FF5733)",
  "instance": "/api/v1/organization-settings/ORG-123/branding",
  "properties": {
    "errors": {
      "primaryColor": "Primary color must be a valid hex color (e.g., #FF5733)"
    }
  }
}
```

---

## Database Schema

Settings are stored in the `organization_settings` table:

```sql
CREATE TABLE organization_settings (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL UNIQUE,
    settings JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**JSONB Structure:**
```json
{
  "branding": {
    "logo": "https://...",
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "companyName": "Acme Corp"
  },
  "integrations": {
    "whatsapp": {
      "enabled": true,
      "credentials": {
        "apiKey": "ENC(encrypted-base64-string)",
        "phoneNumberId": "123456789"
      },
      "config": { ... }
    },
    "email": { ... },
    "sms": { ... }
  },
  "workflow": {
    "enabledFeatures": [...],
    "defaultCaseTypes": [...],
    "statusTransitionRules": { ... }
  },
  "quotas": {
    "maxUsers": 50,
    "maxDossiers": 10000,
    "maxStorage": 52428800,
    "rateLimitTier": "PREMIUM"
  }
}
```

---

## Example Usage

### Create Initial Settings for Organization
```bash
curl -X POST http://localhost:8080/api/v1/organization-settings/ORG-123 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branding": {
      "companyName": "Acme Corporation",
      "primaryColor": "#007bff",
      "secondaryColor": "#6c757d",
      "logo": "https://cdn.example.com/logo.png"
    },
    "workflow": {
      "enabledFeatures": ["LEAD_SCORING", "AUTO_ASSIGNMENT"],
      "defaultCaseTypes": ["VENTE", "LOCATION"],
      "statusTransitionRules": {
        "NEW": ["IN_PROGRESS"],
        "IN_PROGRESS": ["QUALIFIED", "DISQUALIFIED"]
      }
    },
    "quotas": {
      "maxUsers": 50,
      "maxDossiers": 10000,
      "maxStorage": 52428800,
      "rateLimitTier": "PREMIUM"
    }
  }'
```

### Update Integration Credentials
```bash
curl -X PUT http://localhost:8080/api/v1/organization-settings/ORG-123/integrations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp": {
      "enabled": true,
      "credentials": {
        "apiKey": "your-whatsapp-api-key",
        "phoneNumberId": "123456789012"
      },
      "config": {
        "webhookUrl": "https://api.example.com/webhook/whatsapp",
        "businessAccountId": "987654321"
      }
    },
    "email": {
      "enabled": true,
      "credentials": {
        "smtpUsername": "noreply@example.com",
        "smtpPassword": "your-smtp-password"
      },
      "config": {
        "smtpHost": "smtp.sendgrid.net",
        "smtpPort": 587,
        "fromAddress": "noreply@example.com",
        "fromName": "Acme Notifications"
      }
    }
  }'
```

### Get Current Organization Branding (Public)
```bash
curl -X GET http://localhost:8080/api/v1/organization-settings/ORG-123/branding \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Response:**
```json
{
  "logo": "https://cdn.example.com/logo.png",
  "primaryColor": "#007bff",
  "secondaryColor": "#6c757d",
  "companyName": "Acme Corporation"
}
```

---

## Testing

### Unit Tests
```java
@ExtendWith(MockitoExtension.class)
class OrganizationSettingsServiceTest {
    
    @Mock
    private OrganizationSettingsRepository repository;
    
    @Mock
    private FieldEncryptionService encryptionService;
    
    @InjectMocks
    private OrganizationSettingsService service;
    
    @Test
    void testGetSettings() {
        // Test retrieval
    }
    
    @Test
    void testUpdateBranding_adminOnly() {
        // Test admin validation
    }
    
    @Test
    void testEncryptIntegrationCredentials() {
        // Test encryption
    }
}
```

### Integration Tests
```java
@SpringBootTest
@AutoConfigureMockMvc
class OrganizationSettingsControllerIT {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void testUpdateSettings_success() throws Exception {
        mockMvc.perform(put("/api/v1/organization-settings/ORG-123")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ ... }"))
                .andExpect(status().isOk());
    }
    
    @Test
    @WithMockUser(roles = "USER")
    void testUpdateSettings_forbidden() throws Exception {
        mockMvc.perform(put("/api/v1/organization-settings/ORG-123")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ ... }"))
                .andExpect(status().isForbidden());
    }
}
```

---

## Migration Guide

If you have existing organization settings in different tables, migrate to this service:

1. **Extract existing settings** from old tables
2. **Map to new DTOs** (BrandingSettings, IntegrationSettings, etc.)
3. **Create settings** via service: `createSettings(orgId, request)`
4. **Verify encryption** of integration credentials
5. **Update client code** to use new endpoints
6. **Remove old tables** after validation

---

## Configuration

### Jasypt Encryption Password
Set via environment variable or application properties:

```yaml
jasypt:
  encryptor:
    password: ${JASYPT_ENCRYPTOR_PASSWORD:default-dev-password}
```

**Production:** Always use strong password from secrets management (AWS Secrets Manager, Vault, etc.)

### Redis Cache
```yaml
cache:
  redis:
    enabled: true

spring:
  data:
    redis:
      host: localhost
      port: 6379
```

---

## Architecture Decisions

### Why JSONB?
- Flexible schema evolution
- No migrations needed for new settings
- Native PostgreSQL JSON querying
- Reduced table proliferation

### Why Category-based?
- Clear separation of concerns
- Granular access control
- Independent update cycles
- Easier testing and validation

### Why Jasypt?
- Spring Boot native integration
- Proven encryption algorithms
- Property-level encryption
- No external key management required

---

## Future Enhancements

- [ ] Settings versioning and rollback
- [ ] Settings inheritance (organization -> team -> user)
- [ ] Settings audit log (who changed what when)
- [ ] Settings templates library
- [ ] Import/Export settings as JSON
- [ ] Settings change webhooks
- [ ] Multi-region settings replication
