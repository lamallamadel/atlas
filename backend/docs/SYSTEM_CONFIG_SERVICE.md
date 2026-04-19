# SystemConfigService Documentation

## Overview

The `SystemConfigService` manages global system-wide configuration parameters that affect the entire application. This service provides a centralized way to configure network settings, security policies, and performance tuning parameters.

## Key Features

- **Super Admin Only Access**: All operations require `ROLE_SUPER_ADMIN` role
- **Encrypted Sensitive Values**: Security-sensitive fields (like password policies) are encrypted using Jasypt
- **Cached Configuration**: Settings are cached for 12 hours to reduce database load
- **Category-based Organization**: Settings are organized into three categories:
  - **Network Settings**: Proxy and timeout configurations
  - **Security Settings**: Authentication and session policies
  - **Performance Settings**: Caching and resource limits

## Architecture

### Database Schema

The service uses the existing `system_config` table created in migration V38:

```sql
CREATE TABLE system_config (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    category VARCHAR(100),
    encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_system_config_key UNIQUE (key)
);
```

### Configuration Keys

- `system.network.settings` - JSON object containing NetworkSettingsDto
- `system.security.settings` - JSON object containing SecuritySettingsDto (encrypted)
- `system.performance.settings` - JSON object containing PerformanceSettingsDto

## Settings Details

### Network Settings

Controls network connectivity parameters for the application.

**Fields:**
- `proxyHost` (String, optional): HTTP proxy hostname
- `proxyPort` (Integer, optional, 1-65535): HTTP proxy port
- `connectTimeout` (Integer, required, 100-300000ms): Connection timeout in milliseconds
- `readTimeout` (Integer, required, 100-300000ms): Read timeout in milliseconds

**Default Values:**
```json
{
  "proxyHost": null,
  "proxyPort": null,
  "connectTimeout": 30000,
  "readTimeout": 60000
}
```

### Security Settings

Defines authentication and authorization policies.

**Fields:**
- `sessionTimeout` (Integer, required, min 60 seconds): User session timeout in seconds
- `passwordPolicy` (String, required): Password complexity policy (ENCRYPTED)
- `mfaEnabled` (Boolean, required): Whether Multi-Factor Authentication is enabled
- `maxLoginAttempts` (Integer, required, min 1): Maximum failed login attempts before lockout

**Default Values:**
```json
{
  "sessionTimeout": 3600,
  "passwordPolicy": "MEDIUM",
  "mfaEnabled": false,
  "maxLoginAttempts": 5
}
```

**Encryption:**
The `passwordPolicy` field is automatically encrypted when stored and decrypted when retrieved. The encryption uses Jasypt with the application's configured encryption key.

### Performance Settings

Configures application performance and resource limits.

**Fields:**
- `cacheEnabled` (Boolean, required): Enable/disable application caching
- `batchSize` (Integer, required, min 1): Default batch size for bulk operations
- `asyncPoolSize` (Integer, required, min 1): Thread pool size for async operations
- `maxFileUploadSize` (Long, required, min 1 bytes): Maximum file upload size in bytes

**Default Values:**
```json
{
  "cacheEnabled": true,
  "batchSize": 100,
  "asyncPoolSize": 10,
  "maxFileUploadSize": 10485760
}
```

## API Endpoints

All endpoints require `ROLE_SUPER_ADMIN` role and are prefixed with `/api/v1/admin/system-config`.

### Get All Configuration

```
GET /api/v1/admin/system-config
```

Returns all system configuration settings grouped by category.

**Response:**
```json
{
  "id": 1,
  "networkSettings": { ... },
  "securitySettings": { ... },
  "performanceSettings": { ... },
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-15T14:30:00"
}
```

### Update All Configuration

```
PUT /api/v1/admin/system-config
```

Updates one or more configuration categories. Only provided categories are updated.

**Request Body:**
```json
{
  "networkSettings": { ... },
  "securitySettings": { ... },
  "performanceSettings": { ... }
}
```

### Get/Update Network Settings

```
GET /api/v1/admin/system-config/network
PUT /api/v1/admin/system-config/network
```

**PUT Request Body:**
```json
{
  "proxyHost": "proxy.example.com",
  "proxyPort": 8080,
  "connectTimeout": 30000,
  "readTimeout": 60000
}
```

### Get/Update Security Settings

```
GET /api/v1/admin/system-config/security
PUT /api/v1/admin/system-config/security
```

**PUT Request Body:**
```json
{
  "sessionTimeout": 7200,
  "passwordPolicy": "STRONG",
  "mfaEnabled": true,
  "maxLoginAttempts": 3
}
```

### Get/Update Performance Settings

```
GET /api/v1/admin/system-config/performance
PUT /api/v1/admin/system-config/performance
```

**PUT Request Body:**
```json
{
  "cacheEnabled": true,
  "batchSize": 200,
  "asyncPoolSize": 20,
  "maxFileUploadSize": 20971520
}
```

### Reset to Defaults

```
POST /api/v1/admin/system-config/reset
```

Resets all configuration settings to their default values.

**Response:** 204 No Content

## Security

### Access Control

- **Role Required:** `ROLE_SUPER_ADMIN`
- **Enforcement:** `@PreAuthorize("hasRole('SUPER_ADMIN')")` on controller and service validation
- **Unauthorized Access:** Returns 403 Forbidden

### Sensitive Data Encryption

The `passwordPolicy` field in Security Settings is automatically encrypted using Jasypt before storage and decrypted on retrieval. This ensures that sensitive security policies are not stored in plain text.

**Encryption Configuration:**
- Encryption key must be configured in application properties
- Uses AES-256 encryption (configured in `JasyptConfig`)
- Automatic encryption/decryption is transparent to API consumers

## Caching

System configuration is cached using Spring Cache with Redis backend:

- **Cache Name:** `systemConfig`
- **TTL:** 12 hours
- **Cache Key:** `'all'` for full configuration, individual keys for specific settings
- **Eviction:** Automatic on any update operation using `@CacheEvict`

**Configuration in CacheConfig.java:**
```java
cacheConfigurations.put("systemConfig", defaultConfig.entryTtl(Duration.ofHours(12)));
```

## Usage Examples

### Java Service Integration

```java
@Service
public class MyService {
    
    private final SystemConfigService systemConfigService;
    
    public void configureProxyClient() {
        NetworkSettingsDto networkSettings = systemConfigService.getNetworkSettings();
        
        if (networkSettings.getProxyHost() != null) {
            HttpClient client = HttpClient.newBuilder()
                .proxy(ProxySelector.of(new InetSocketAddress(
                    networkSettings.getProxyHost(), 
                    networkSettings.getProxyPort()
                )))
                .connectTimeout(Duration.ofMillis(networkSettings.getConnectTimeout()))
                .build();
        }
    }
    
    public void enforceSecurityPolicy() {
        SecuritySettingsDto securitySettings = systemConfigService.getSecuritySettings();
        
        if (securitySettings.getMfaEnabled()) {
            // Enforce MFA
        }
        
        // Set session timeout
        sessionManager.setTimeout(securitySettings.getSessionTimeout());
    }
}
```

### REST API Call (with curl)

```bash
# Get all configuration
curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/v1/admin/system-config

# Update security settings
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "sessionTimeout": 7200,
       "passwordPolicy": "STRONG",
       "mfaEnabled": true,
       "maxLoginAttempts": 3
     }' \
     http://localhost:8080/api/v1/admin/system-config/security

# Reset to defaults
curl -X POST \
     -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/v1/admin/system-config/reset
```

## Implementation Details

### Service Layer (`SystemConfigService`)

**Key Methods:**
- `getSystemConfig()`: Retrieves all configuration (cached)
- `updateSystemConfig(request)`: Updates one or more configuration categories
- `getNetworkSettings()`: Retrieves network settings
- `updateNetworkSettings(settings)`: Updates network settings
- `getSecuritySettings()`: Retrieves and decrypts security settings
- `updateSecuritySettings(settings)`: Encrypts and updates security settings
- `getPerformanceSettings()`: Retrieves performance settings
- `updatePerformanceSettings(settings)`: Updates performance settings
- `resetToDefaults()`: Resets all settings to default values

**Private Methods:**
- `validateSuperAdminAccess()`: Validates ROLE_SUPER_ADMIN
- `encryptSecuritySettings(settings)`: Encrypts sensitive fields
- `decryptSecuritySettings(settings)`: Decrypts sensitive fields
- `getDefaultNetworkSettings()`: Returns default network settings
- `getDefaultSecuritySettings()`: Returns default security settings
- `getDefaultPerformanceSettings()`: Returns default performance settings

### Controller Layer (`SystemConfigController`)

- **Base Path:** `/api/v1/admin/system-config`
- **Security:** `@PreAuthorize("hasRole('SUPER_ADMIN')")` on class level
- **Swagger Documentation:** Complete OpenAPI annotations

### DTOs

- `SystemConfigResponse`: Complete configuration response
- `SystemConfigUpdateRequest`: Request to update configuration
- `NetworkSettingsDto`: Network configuration settings
- `SecuritySettingsDto`: Security configuration settings
- `PerformanceSettingsDto`: Performance configuration settings

## Testing Considerations

### Unit Tests

Test scenarios should include:
- Access control validation (non-super-admin rejection)
- Encryption/decryption of sensitive fields
- Default value retrieval
- Partial updates (only specified categories)
- Cache eviction on updates

### Integration Tests

Test scenarios should include:
- End-to-end API calls with authentication
- Database persistence of encrypted values
- Cache behavior and TTL
- Concurrent updates and optimistic locking

### E2E Tests

Test scenarios should include:
- Super admin workflow for configuring system
- Verification that settings affect application behavior
- Reset to defaults functionality

## Migration and Deployment

### Initial Setup

The system_config table already exists from V38 migration. No additional migrations are needed.

### Seeding Initial Values

On first deployment, the service will use default values if no configuration exists in the database. Super admins can then customize as needed.

### Upgrading

When adding new configuration fields:
1. Add fields to respective DTOs
2. Update default value methods in service
3. Update API documentation
4. Deploy - existing configurations will merge with new default fields

## Troubleshooting

### Common Issues

**Issue:** 403 Forbidden when accessing endpoints
- **Cause:** User does not have ROLE_SUPER_ADMIN
- **Solution:** Ensure user has correct role in Keycloak/auth system

**Issue:** Decryption error for password policy
- **Cause:** Encryption key changed or database value corrupted
- **Solution:** Use reset endpoint to restore defaults

**Issue:** Changes not reflected immediately
- **Cause:** Redis cache TTL of 12 hours
- **Solution:** Clear cache manually or wait for expiration

**Issue:** Validation errors on update
- **Cause:** Invalid values (e.g., negative timeouts, ports out of range)
- **Solution:** Check validation constraints in DTOs

## Best Practices

1. **Backup Before Changes:** Always backup current configuration before making changes
2. **Test in Staging:** Test configuration changes in staging environment first
3. **Monitor Impact:** Monitor application behavior after configuration changes
4. **Document Changes:** Document why specific values were chosen
5. **Use Defaults:** Start with defaults and adjust based on monitoring data
6. **Security Review:** Have security team review security settings changes

## Future Enhancements

Potential improvements for future versions:

1. **Configuration Versioning:** Track history of configuration changes
2. **Audit Trail:** Log who changed what and when
3. **Configuration Validation:** Pre-validation of settings before applying
4. **Environment-Specific Defaults:** Different defaults per environment
5. **Configuration Import/Export:** Backup and restore configuration sets
6. **Real-time Updates:** Push configuration changes to running instances
7. **Configuration Templates:** Pre-defined configuration profiles
8. **Dependency Validation:** Validate related settings (e.g., MFA requires certain password policy)
