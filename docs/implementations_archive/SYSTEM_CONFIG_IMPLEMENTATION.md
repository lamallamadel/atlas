# System Configuration API Implementation

## Overview

Implementation of a comprehensive System Configuration API at `/api/v1/system/config` that allows Super Admins to manage global system configuration parameters with full audit logging, validation, and security.

## Architecture

### Components

1. **SystemConfigController** - REST API endpoints
2. **SystemConfigService** - Business logic and validation
3. **FieldEncryptionService** - Encryption/decryption for sensitive values
4. **SystemConfig Entity** - Database model
5. **SystemConfigRepository** - Data access layer

### Key Features

- ✅ Full CRUD operations on system configuration
- ✅ Role-based access control (SUPER_ADMIN only)
- ✅ Comprehensive audit logging
- ✅ Value validation
- ✅ Configuration health checks
- ✅ Hot reload without restart
- ✅ Encryption for sensitive values

## API Endpoints

### 1. Get All Configuration Parameters

```http
GET /api/v1/system/config
```

**Security**: `@PreAuthorize("hasRole('SUPER_ADMIN')")`

**Response**:
```json
{
  "configs": [
    {
      "id": 1,
      "key": "system.network.settings",
      "value": "{...}",
      "category": "NETWORK",
      "encrypted": false,
      "createdAt": "2024-01-15T10:30:00",
      "updatedAt": "2024-01-15T10:30:00"
    }
  ],
  "totalCount": 3
}
```

### 2. Update Specific Configuration Parameter

```http
PUT /api/v1/system/config/{key}
```

**Security**: `@PreAuthorize("hasRole('SUPER_ADMIN')")`

**Request Body**:
```json
{
  "value": "{\"proxyHost\":\"proxy.example.com\",\"proxyPort\":8080}"
}
```

**Validation**:
- Key cannot be null or empty
- Value cannot be null
- JSON validation for system settings keys
- Range validation for numeric values

**Response**:
```json
{
  "id": 1,
  "key": "system.network.settings",
  "value": "{...}",
  "category": "NETWORK",
  "encrypted": false,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T15:45:00"
}
```

**Audit Log**: Full audit trail with before/after values

### 3. Reload Configuration Without Restart

```http
POST /api/v1/system/config/reload
```

**Security**: `@PreAuthorize("hasRole('SUPER_ADMIN')")`

**Response**:
```json
{
  "success": true,
  "message": "Configuration reloaded successfully",
  "configsReloaded": 3,
  "reloadedAt": "2024-01-15T16:00:00"
}
```

**Audit Log**: Records reload action with timestamp and user

### 4. Check Configuration Health

```http
GET /api/v1/system/config/health
```

**Security**: `@PreAuthorize("hasRole('SUPER_ADMIN')")`

**Response**:
```json
{
  "valid": true,
  "status": "HEALTHY",
  "errors": [],
  "details": {
    "networkSettings": "checked",
    "securitySettings": "checked",
    "performanceSettings": "checked",
    "totalConfigs": 3,
    "encryptedConfigs": 1
  },
  "checkedAt": "2024-01-15T16:05:00"
}
```

**Validation Checks**:
- Network settings: timeout values, proxy port range
- Security settings: session timeout minimum, max login attempts
- Performance settings: batch size, pool size, file size limits

**Audit Log**: Records health check with results

## Configuration Categories

### Network Settings

```json
{
  "proxyHost": "proxy.example.com",
  "proxyPort": 8080,
  "connectTimeout": 30000,
  "readTimeout": 60000
}
```

**Validation**:
- `proxyPort`: 1-65535
- `connectTimeout`: 100-300000 ms
- `readTimeout`: 100-300000 ms

### Security Settings

```json
{
  "sessionTimeout": 3600,
  "passwordPolicy": "MEDIUM",
  "mfaEnabled": false,
  "maxLoginAttempts": 5
}
```

**Validation**:
- `sessionTimeout`: ≥ 60 seconds
- `maxLoginAttempts`: ≥ 1
- `passwordPolicy`: Encrypted field

### Performance Settings

```json
{
  "cacheEnabled": true,
  "batchSize": 100,
  "asyncPoolSize": 10,
  "maxFileUploadSize": 10485760
}
```

**Validation**:
- `batchSize`: ≥ 1
- `asyncPoolSize`: ≥ 1
- `maxFileUploadSize`: ≥ 0

## Security

### Authentication & Authorization

- All endpoints require authentication
- All endpoints require `SUPER_ADMIN` role via `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- JWT token validation
- User ID extraction from JWT subject

### Audit Logging

Every operation is logged with:
- **Entity Type**: `SYSTEM_CONFIG`
- **Action**: `CREATED`, `UPDATED`, `RELOAD`, `CONFIG_HEALTH_CHECK`
- **User ID**: Extracted from JWT token
- **Timestamp**: ISO 8601 format
- **Diff**: Before/after values for updates

**Audit Event Structure**:
```json
{
  "entityType": "SYSTEM_CONFIG",
  "entityId": 1,
  "action": "UPDATED",
  "userId": "user@example.com",
  "orgId": "system",
  "diff": {
    "before": {"key": "old_value"},
    "after": {"key": "new_value"},
    "changes": {
      "key": {
        "before": "old_value",
        "after": "new_value"
      }
    }
  },
  "createdAt": "2024-01-15T15:45:00"
}
```

### Encryption

Sensitive configuration values are encrypted using Jasypt:
- **Algorithm**: PBEWITHHMACSHA512ANDAES_256
- **Key Iterations**: 1000
- **Salt Generator**: RandomSaltGenerator
- **IV Generator**: RandomIvGenerator
- **Output Type**: Base64

**Encrypted Fields**:
- `SecuritySettings.passwordPolicy`

## Implementation Details

### FieldEncryptionService

Created service for encrypting/decrypting sensitive configuration values:

```java
@Service
public class FieldEncryptionService {
    private final StringEncryptor encryptor;
    
    public String encrypt(String plainText) { ... }
    public String decrypt(String encryptedText) { ... }
}
```

Uses Jasypt `StringEncryptor` bean configured in `JasyptConfig`.

### SystemConfigService Enhancements

1. **Validation Method**: `validateConfigValue(String key, String value)`
   - Validates JSON format for system settings
   - Validates range constraints
   - Throws `IllegalArgumentException` for invalid values

2. **Audit Logging**: `logAuditEvent(...)`
   - Logs all operations to `AuditEventEntity`
   - Captures before/after state using `AuditDiffCalculator`
   - Includes user ID and timestamp

3. **Health Checks**: `checkConfigHealth()`
   - Validates all configuration categories
   - Returns detailed error messages
   - Provides configuration statistics

### SystemConfigController Enhancements

1. **User Tracking**: Added `extractUserId()` helper
   - Extracts user from JWT token
   - Logs user for all operations
   - Falls back to "anonymous" if not authenticated

2. **Enhanced Logging**:
   - Request logging with user ID
   - Success/failure logging
   - Performance metrics logging

3. **DTO Validation**: Uses `@Valid` annotations
   - Request body validation
   - Path variable validation
   - JSON format validation

## Configuration Validation Rules

### Network Settings
| Field | Type | Min | Max | Required |
|-------|------|-----|-----|----------|
| proxyHost | String | - | - | No |
| proxyPort | Integer | 1 | 65535 | No |
| connectTimeout | Integer | 100 | 300000 | No |
| readTimeout | Integer | 100 | 300000 | No |

### Security Settings
| Field | Type | Min | Max | Required |
|-------|------|-----|-----|----------|
| sessionTimeout | Integer | 60 | - | Yes |
| passwordPolicy | String | - | - | Yes (encrypted) |
| mfaEnabled | Boolean | - | - | No |
| maxLoginAttempts | Integer | 1 | - | Yes |

### Performance Settings
| Field | Type | Min | Max | Required |
|-------|------|-----|-----|----------|
| cacheEnabled | Boolean | - | - | No |
| batchSize | Integer | 1 | - | Yes |
| asyncPoolSize | Integer | 1 | - | Yes |
| maxFileUploadSize | Long | 0 | - | Yes |

## Error Handling

### Validation Errors

**400 Bad Request**:
```json
{
  "timestamp": "2024-01-15T16:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Connect timeout must be between 100 and 300000 milliseconds",
  "path": "/api/v1/system/config/system.network.settings"
}
```

### Authorization Errors

**403 Forbidden**:
```json
{
  "timestamp": "2024-01-15T16:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Only super administrators can access system configuration",
  "path": "/api/v1/system/config"
}
```

### Not Found Errors

**404 Not Found**:
```json
{
  "timestamp": "2024-01-15T16:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Configuration key not found: invalid.key",
  "path": "/api/v1/system/config/invalid.key"
}
```

## Database Schema

```sql
CREATE TABLE system_config (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    category VARCHAR(100),
    encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_system_config_key ON system_config(key);
```

## Testing Examples

### Get All Configs
```bash
curl -X GET http://localhost:8080/api/v1/system/config \
  -H "Authorization: Bearer {jwt_token}"
```

### Update Network Settings
```bash
curl -X PUT http://localhost:8080/api/v1/system/config/system.network.settings \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "{\"proxyHost\":\"proxy.example.com\",\"proxyPort\":8080,\"connectTimeout\":30000,\"readTimeout\":60000}"
  }'
```

### Reload Configuration
```bash
curl -X POST http://localhost:8080/api/v1/system/config/reload \
  -H "Authorization: Bearer {jwt_token}"
```

### Check Health
```bash
curl -X GET http://localhost:8080/api/v1/system/config/health \
  -H "Authorization: Bearer {jwt_token}"
```

## Files Modified/Created

### Created
1. `backend/src/main/java/com/example/backend/service/FieldEncryptionService.java`

### Modified
1. `backend/src/main/java/com/example/backend/controller/SystemConfigController.java`
   - Enhanced logging with user tracking
   - Added `extractUserId()` helper method
   - Updated PUT /{key} to use DTO instead of raw String

2. `backend/src/main/java/com/example/backend/service/SystemConfigService.java`
   - Added `validateConfigValue()` method
   - Fixed method name references (`getConnectTimeout`, `getBatchSize`, etc.)
   - Enhanced health check validation

## Key Features Summary

✅ **Endpoints**:
- GET /api/v1/system/config - List all parameters
- PUT /api/v1/system/config/{key} - Update specific parameter
- POST /api/v1/system/config/reload - Reload without restart
- GET /api/v1/system/config/health - Health check

✅ **Security**:
- @PreAuthorize("hasRole('SUPER_ADMIN')") on all endpoints
- JWT authentication
- User ID extraction and logging

✅ **Validation**:
- JSON format validation
- Range constraint validation
- Business rule validation

✅ **Audit Logging**:
- Complete audit trail
- Before/after state capture
- User tracking
- Timestamp recording

✅ **Encryption**:
- Jasypt-based encryption
- Sensitive field protection
- Secure key management

## Notes

- All configuration changes are cached using Spring Cache with `@CacheEvict`
- Configuration reload clears all caches automatically
- Audit events are stored in the `audit_event` table
- Encrypted values use base64 encoding
- Default encryption password for development: "default-dev-password-change-in-production"
- Production should use `JASYPT_ENCRYPTOR_PASSWORD` environment variable
