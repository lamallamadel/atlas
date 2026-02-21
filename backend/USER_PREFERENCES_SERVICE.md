# UserPreferencesService - Implementation Documentation

## Overview

The UserPreferencesService provides a comprehensive solution for managing user preferences with category-based organization, JSON schema validation, three-level inheritance, L1 caching, and automatic audit trails.

## Features

### 1. Category-Based Preferences

Preferences are organized into four distinct categories:

- **ui**: User interface preferences (theme, sidebar, dashboard layout, density)
- **notifications**: Notification preferences (email, push, SMS, quiet hours)
- **formats**: Format preferences (locale, date/time formats, timezone, currency)
- **shortcuts**: Keyboard shortcut configurations

### 2. JSON Schema Validation

Each category has its own JSON schema that validates incoming data:

#### UI Schema
```json
{
  "theme": "light|dark|auto",
  "sidebarCollapsed": boolean,
  "dashboardLayout": {
    "widgets": [{ "type", "x", "y", "cols", "rows" }]
  },
  "density": "compact|comfortable|spacious"
}
```

#### Notifications Schema
```json
{
  "emailEnabled": boolean,
  "pushEnabled": boolean,
  "smsEnabled": boolean,
  "channels": {
    "taskAssigned": boolean,
    "dossierUpdated": boolean,
    "messageReceived": boolean,
    "appointmentReminder": boolean
  },
  "quietHours": {
    "enabled": boolean,
    "start": "HH:mm",
    "end": "HH:mm"
  }
}
```

#### Formats Schema
```json
{
  "locale": "fr|en|es|ar",
  "dateFormat": "dd/MM/yyyy|MM/dd/yyyy|yyyy-MM-dd",
  "timeFormat": "HH:mm|hh:mm a",
  "timezone": "Europe/Paris",
  "currency": "EUR",
  "numberFormat": "1 234,56"
}
```

#### Shortcuts Schema
```json
{
  "[action_name]": {
    "keys": ["Ctrl", "S"],
    "enabled": boolean
  }
}
```

### 3. Three-Level Inheritance

Preferences are resolved using a merge strategy with three levels:

1. **System Defaults** - Base configuration for all users
2. **Organization Settings** - Organization-specific overrides
3. **User Preferences** - Individual user overrides

The merge logic follows this hierarchy:
```
User Preferences (highest priority)
    ↓ overrides
Organization Settings
    ↓ overrides
System Defaults (lowest priority)
```

#### Deep Merge Strategy

The service uses deep merge for nested objects:
- System: `{ "theme": "light", "density": "comfortable" }`
- Organization: `{ "theme": "dark" }`
- User: `{ "density": "compact" }`
- **Result**: `{ "theme": "dark", "density": "compact" }`

### 4. L1 Caching with @Cacheable

To avoid repeated database queries, the service implements L1 caching:

- **Cache Name**: `userPreferences`
- **Cache Key Pattern**: `userId:category`
- **TTL**: 30 minutes (configured in `CacheConfig`)
- **Backend**: Redis (fallback to in-memory)

#### Cache Operations

- `@Cacheable`: Applied to `getPreferencesByCategory()`
- `@CacheEvict`: Applied to `setPreferencesByCategory()` and `resetPreferencesByCategory()`

```java
@Cacheable(value = CACHE_NAME, key = "#userId + ':' + #category")
public Map<String, Object> getPreferencesByCategory(String userId, String category)

@CacheEvict(value = CACHE_NAME, key = "#userId + ':' + #category")
public Map<String, Object> setPreferencesByCategory(String userId, String category, Map<String, Object> preferences)
```

### 5. Automatic Audit Trail

The service integrates with `AuditAspect` to automatically capture all modifications:

#### Audit Configuration

- **Entity Type**: `USER_PREFERENCES`
- **Captured Methods**: `setPreferencesByCategory()`, `resetPreferencesByCategory()`
- **Audit Actions**: `UPDATED` (for both set and reset)

#### Audit Data

For each modification, the following is captured:
- User ID (who made the change)
- Organization ID
- Timestamp
- Before state (previous preferences)
- After state (new preferences)
- Diff (calculated changes)

#### Diff Structure

```json
{
  "changes": {
    "theme": {
      "before": "light",
      "after": "dark"
    },
    "density": {
      "before": "comfortable",
      "after": "compact"
    }
  }
}
```

## API Endpoints

### Get Preferences by Category
```http
GET /api/v1/user-preferences/{userId}/category/{category}
```

Returns merged preferences for the category with inheritance applied.

### Set Preferences by Category
```http
PUT /api/v1/user-preferences/{userId}/category/{category}
Content-Type: application/json

{
  "preferences": {
    "theme": "dark",
    "sidebarCollapsed": true
  }
}
```

Validates and saves preferences for the category. Cache is automatically evicted.

### Reset Preferences by Category
```http
DELETE /api/v1/user-preferences/{userId}/category/{category}
```

Resets user preferences to organization/system defaults. Cache is automatically evicted.

### Get All Categories
```http
GET /api/v1/user-preferences/{userId}/all-categories
```

Returns all preferences organized by categories.

## Service Methods

### Core Methods

```java
// Get preferences with inheritance
Map<String, Object> getPreferencesByCategory(String userId, String category)

// Set preferences with validation
Map<String, Object> setPreferencesByCategory(String userId, String category, Map<String, Object> preferences)

// Reset to defaults
Map<String, Object> resetPreferencesByCategory(String userId, String category)

// Get all categories
Map<String, Object> getAllPreferences(String userId)
```

### Internal Methods

```java
// Validation
void validateCategory(String category)
void validatePreferences(String category, Map<String, Object> preferences)

// Data retrieval
Map<String, Object> getUserPreferencesMap(String userId)
Map<String, Object> getOrganizationPreferencesMap()
Map<String, Object> getSystemPreferencesMap()

// Merge logic
Map<String, Object> mergePreferences(Map<String, Object> systemPrefs, 
                                     Map<String, Object> orgPrefs, 
                                     Map<String, Object> userPrefs)
void deepMerge(Map<String, Object> target, Map<String, Object> source)
```

## Database Schema

### UserPreferences Table (V2)

```sql
CREATE TABLE user_preferences_v2 (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    preferences JSONB,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Preferences JSON Structure

```json
{
  "ui": { ... },
  "notifications": { ... },
  "formats": { ... },
  "shortcuts": { ... }
}
```

## Configuration

### System Defaults

System defaults are stored in `system_config` table with key `preferences.defaults` or hardcoded in the service:

```java
private Map<String, Object> getDefaultSystemPreferences() {
    Map<String, Object> defaults = new HashMap<>();
    
    // UI defaults
    Map<String, Object> ui = new HashMap<>();
    ui.put("theme", "light");
    ui.put("sidebarCollapsed", false);
    ui.put("density", "comfortable");
    defaults.put("ui", ui);
    
    // ... other categories
    
    return defaults;
}
```

### Organization Settings

Organization settings are stored in `organization_settings` table:

```sql
SELECT settings->'preferences' FROM organization_settings WHERE org_id = ?
```

### Cache Configuration

Cache is configured in `CacheConfig.java`:

```java
cacheConfigurations.put("userPreferences", defaultConfig.entryTtl(Duration.ofMinutes(30)));
```

## Error Handling

### Validation Errors

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed for category ui: $.theme: does not have a value in the enumeration [light, dark, auto]",
  "instance": "/api/v1/user-preferences/user123/category/ui"
}
```

### Invalid Category

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid category: settings. Must be one of: ui, notifications, formats, shortcuts",
  "instance": "/api/v1/user-preferences/user123/category/settings"
}
```

## Dependencies

### Maven Dependencies

```xml
<dependency>
    <groupId>com.networknt</groupId>
    <artifactId>json-schema-validator</artifactId>
    <version>1.0.87</version>
</dependency>
```

### Spring Dependencies

- `spring-boot-starter-cache`
- `spring-boot-starter-data-redis`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-aop`

## Performance Considerations

### Caching Benefits

- **First Request**: Database query + inheritance merge
- **Subsequent Requests (within 30min)**: Cache hit, no database query
- **Write Operations**: Cache eviction ensures consistency

### Optimization Tips

1. **Batch Updates**: Use `getAllPreferences()` to fetch all categories at once
2. **Selective Updates**: Update only changed categories to minimize cache evictions
3. **Read-Heavy**: The service is optimized for read-heavy workloads with L1 caching

## Testing

### Unit Test Example

```java
@Test
void testGetPreferencesByCategory_withInheritance() {
    // Given
    String userId = "user123";
    String category = "ui";
    
    // System defaults
    when(systemConfigRepository.findByKey("preferences.defaults"))
        .thenReturn(Optional.of(systemConfigWithDefaults()));
    
    // Organization settings
    when(organizationSettingsRepository.findByOrgId("org1"))
        .thenReturn(Optional.of(orgSettingsWithTheme("dark")));
    
    // User preferences
    when(userPreferencesV2Repository.findByUserId(userId))
        .thenReturn(Optional.of(userPrefsWithDensity("compact")));
    
    // When
    Map<String, Object> result = service.getPreferencesByCategory(userId, category);
    
    // Then
    assertThat(result.get("theme")).isEqualTo("dark"); // from org
    assertThat(result.get("density")).isEqualTo("compact"); // from user
    assertThat(result.get("sidebarCollapsed")).isEqualTo(false); // from system
}
```

### Integration Test Example

```java
@Test
void testSetPreferences_withValidation() {
    // Given
    String userId = "user123";
    String category = "ui";
    Map<String, Object> preferences = Map.of(
        "theme", "dark",
        "density", "compact"
    );
    
    // When
    Map<String, Object> result = service.setPreferencesByCategory(userId, category, preferences);
    
    // Then
    assertThat(result.get("theme")).isEqualTo("dark");
    assertThat(result.get("density")).isEqualTo("compact");
    
    // Verify audit trail
    verify(auditEventRepository).save(argThat(event -> 
        event.getEntityType() == AuditEntityType.USER_PREFERENCES &&
        event.getAction() == AuditAction.UPDATED
    ));
}
```

## Migration from Legacy Service

The service maintains backward compatibility with the existing `UserPreferencesEntity` and `UserPreferencesRepository`:

- Legacy methods (`getUserPreferences()`, `saveUserPreferences()`, etc.) are preserved
- New category-based methods use `UserPreferencesV2Repository`
- Both can coexist during migration period

### Migration Steps

1. Continue using legacy methods for existing functionality
2. Gradually adopt category-based methods for new features
3. Use `getAllPreferences()` to bridge between old and new formats
4. Eventually deprecate legacy methods once migration is complete

## Troubleshooting

### Cache Not Working

Check Redis connection:
```bash
redis-cli ping
```

Verify cache configuration:
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

### Schema Validation Errors

Enable debug logging:
```yaml
logging:
  level:
    com.example.backend.service.UserPreferencesService: DEBUG
```

Check validation messages in logs for detailed error information.

### Audit Trail Missing

Verify AuditAspect is enabled:
```java
@EnableAspectJAutoProxy
```

Check method names match the aspect pointcut pattern.

## Future Enhancements

- [ ] Support for preference templates (predefined configurations)
- [ ] Import/export preferences across users
- [ ] Preference versioning and rollback
- [ ] Real-time preference sync via WebSocket
- [ ] Preference change notifications
- [ ] Admin UI for managing system/org defaults
