# UserService - User Name Resolution

## Overview

The `UserService` provides user ID to display name resolution with intelligent fallback strategies and in-memory LRU caching for optimal performance.

## Features

### 1. Display Name Resolution

The service resolves user IDs to human-readable display names using the following fallback strategy:

1. **Full Name**: If available from the user management system (priority 1)
2. **Email**: If full name is not available (priority 2)
3. **"Système"**: If the user ID is null, blank, or "system"
4. **"Utilisateur supprimé"**: If the user ID doesn't exist in the system

### 2. Performance Optimization

#### LRU Cache
- **Type**: In-memory Least Recently Used (LRU) cache
- **Implementation**: `LinkedHashMap` with access-order tracking
- **Max Size**: 1000 entries
- **Behavior**: Automatically evicts least recently used entries when max size is reached

#### Batch Operations
The `getUserDisplayNames(List<String>)` method processes multiple user IDs in a single call:
- Eliminates duplicate IDs automatically
- Reduces overhead compared to individual calls
- Optimal for bulk operations (e.g., enriching paginated lists)

### 3. Integration Points

The service is designed to be integrated with various user management systems:

#### Option A: Keycloak Admin API
```java
// Example integration (to be implemented in fetchUserDisplayName)
Keycloak keycloak = KeycloakBuilder.builder()
    .serverUrl(keycloakUrl)
    .realm(realm)
    .clientId(clientId)
    .clientSecret(clientSecret)
    .build();

UserResource userResource = keycloak.realm(realm).users().get(userId);
UserRepresentation user = userResource.toRepresentation();

String fullName = user.getFirstName() + " " + user.getLastName();
return fullName.trim().isEmpty() ? user.getEmail() : fullName;
```

#### Option B: Database Table
```java
// Example integration with local user table
@Autowired
private UserRepository userRepository;

Optional<User> user = userRepository.findById(userId);
return user.map(u -> {
    String fullName = u.getFirstName() + " " + u.getLastName();
    return fullName.trim().isEmpty() ? u.getEmail() : fullName;
}).orElse("Utilisateur supprimé");
```

#### Option C: LDAP/Active Directory
```java
// Example integration with LDAP
LdapContext ctx = new InitialLdapContext(env, null);
SearchControls searchControls = new SearchControls();
searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);

NamingEnumeration<SearchResult> results = ctx.search(
    baseDn, 
    "(uid=" + userId + ")", 
    searchControls
);

if (results.hasMore()) {
    SearchResult result = results.next();
    Attributes attrs = result.getAttributes();
    String displayName = (String) attrs.get("displayName").get();
    return displayName != null ? displayName : (String) attrs.get("mail").get();
}

return "Utilisateur supprimé";
```

## API Endpoints

### GET /api/v1/users/{id}/display-name

Retrieves the display name for a specific user ID.

**Request:**
```http
GET /api/v1/users/john.doe@example.com/display-name
Authorization: Bearer <token>
```

**Response:**
```json
{
  "userId": "john.doe@example.com",
  "displayName": "John Doe"
}
```

**Use Cases:**
- Frontend components need to display a single user's name
- Real-time user name resolution
- User profile display

## Usage in ActivityService

The `ActivityService` has been enhanced to automatically enrich all activity responses with user display names:

### Single Activity (getById, create, update)
```java
ActivityResponse response = activityMapper.toResponse(activity);
response.setCreatedByName(userService.getUserDisplayName(activity.getCreatedBy()));
return response;
```

### Paginated List (list method)
```java
// Extract all unique user IDs
List<String> userIds = activities.getContent().stream()
    .map(ActivityEntity::getCreatedBy)
    .distinct()
    .collect(Collectors.toList());

// Batch fetch display names
Map<String, String> displayNames = userService.getUserDisplayNames(userIds);

// Enrich responses
return activities.map(activity -> {
    ActivityResponse response = activityMapper.toResponse(activity);
    response.setCreatedByName(displayNames.get(activity.getCreatedBy()));
    return response;
});
```

**Benefits:**
- **Performance**: Single batch call instead of N individual calls
- **Caching**: Repeated user IDs benefit from cache
- **Consistency**: All activities in a list are enriched uniformly

## ActivityResponse Schema

The `ActivityResponse` DTO now includes:

```json
{
  "id": 1,
  "type": "NOTE",
  "content": "Client called to confirm appointment",
  "dossierId": 123,
  "visibility": "INTERNAL",
  "createdAt": "2024-01-01T12:00:00",
  "createdBy": "john.doe@example.com",
  "createdByName": "John Doe"
}
```

**New Field:**
- `createdByName` (String): Human-readable display name of the user who created the activity

## Cache Management

### Cache Statistics
```java
// Get current cache size
int size = userService.getCacheSize();
```

### Cache Invalidation
```java
// Clear all cached entries
userService.clearCache();
```

**When to clear cache:**
- User information has been updated (name changes, etc.)
- Manual cache refresh needed
- Testing scenarios

## Error Handling

The service gracefully handles various edge cases:

| Scenario | Behavior |
|----------|----------|
| `userId` is null | Returns "Système" |
| `userId` is blank/empty | Returns "Système" |
| `userId` is "system" (case-insensitive) | Returns "Système" |
| `userId` contains "@" | Returns the email as-is |
| User doesn't exist | Returns "Utilisateur supprimé" |
| Valid user | Returns full name or email |

## Performance Characteristics

### Cache Performance
- **Hit Rate**: Depends on workload, but typically high for repeated access patterns
- **Memory Usage**: ~50-100 bytes per cache entry (depends on display name length)
- **Max Memory**: ~50-100 KB for 1000 cached entries

### Batch Operation Performance
For a paginated list of 20 activities:
- **Without batching**: 20 individual calls (even with cache, map lookups)
- **With batching**: 1 batch call to get unique user IDs (typically 1-5 unique users)
- **Improvement**: ~4-20x reduction in service method calls

## Testing Considerations

### Unit Tests
```java
@Test
void testGetUserDisplayName_SystemUser() {
    String displayName = userService.getUserDisplayName("system");
    assertEquals("Système", displayName);
}

@Test
void testGetUserDisplayName_NullUser() {
    String displayName = userService.getUserDisplayName(null);
    assertEquals("Système", displayName);
}

@Test
void testGetUserDisplayName_EmailUser() {
    String displayName = userService.getUserDisplayName("user@example.com");
    assertEquals("user@example.com", displayName);
}

@Test
void testGetUserDisplayNames_Batch() {
    List<String> userIds = List.of("user1", "user2", "user1"); // user1 duplicated
    Map<String, String> names = userService.getUserDisplayNames(userIds);
    assertEquals(2, names.size()); // Duplicates removed
}

@Test
void testCacheBehavior() {
    userService.clearCache();
    assertEquals(0, userService.getCacheSize());
    
    userService.getUserDisplayName("user@example.com");
    assertEquals(1, userService.getCacheSize());
    
    userService.clearCache();
    assertEquals(0, userService.getCacheSize());
}
```

### Integration Tests
```java
@Test
void testActivityListEnrichment() {
    // Create activities with different users
    Activity activity1 = createActivity("user1@example.com");
    Activity activity2 = createActivity("user2@example.com");
    Activity activity3 = createActivity("user1@example.com");
    
    // Fetch paginated list
    Page<ActivityResponse> page = activityService.list(dossierId, null, null, null, pageable);
    
    // Verify createdByName is populated
    for (ActivityResponse response : page.getContent()) {
        assertNotNull(response.getCreatedByName());
        assertFalse(response.getCreatedByName().isEmpty());
    }
}
```

## Future Enhancements

1. **Add cache metrics** for monitoring:
   - Hit rate
   - Miss rate
   - Eviction count

2. **Support for cache warming** on application startup:
   - Pre-load frequently accessed user names
   - Reduce cold start latency

3. **Distributed caching** with Redis/Hazelcast:
   - Share cache across multiple application instances
   - Improve consistency in clustered deployments

4. **User profile caching** beyond display names:
   - Avatar URLs
   - User roles
   - Additional metadata

5. **Async refresh** for stale entries:
   - Background refresh of cache entries
   - Avoid blocking requests for cache updates

6. **Configurable cache size** via application properties:
   ```yaml
   app:
     user-service:
       cache:
         max-size: 1000
         ttl-seconds: 3600
   ```

## Implementation Summary

### Files Created/Modified

1. **Created: `UserService.java`**
   - Single and batch user display name resolution
   - In-memory LRU cache with 1000 entry limit
   - Fallback strategy: full name → email → "Système" → "Utilisateur supprimé"
   - Methods: `getUserDisplayName()`, `getUserDisplayNames()`, `clearCache()`, `getCacheSize()`

2. **Modified: `ActivityResponse.java`**
   - Added `createdByName` field to include resolved display name

3. **Modified: `ActivityService.java`**
   - Injected `UserService` dependency
   - Updated `create()`, `getById()`, `update()` methods to enrich single responses
   - Updated `list()` method to batch-enrich paginated responses
   - Added `enrichWithUserNames()` private method for efficient batch processing

4. **Created: `UserController.java`**
   - Endpoint: `GET /api/v1/users/{id}/display-name`
   - Returns user display name for frontend resolution if needed
   - Includes Swagger/OpenAPI documentation

5. **Created: `USER_SERVICE_DOCUMENTATION.md`**
   - Comprehensive documentation of the UserService implementation
   - Integration examples for Keycloak, database, and LDAP
   - Performance characteristics and testing guidelines
