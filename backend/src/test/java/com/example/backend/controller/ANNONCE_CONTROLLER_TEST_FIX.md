# AnnonceControllerTest Spring Context Failure Fix

## Problem Description

The `AnnonceControllerTest` was failing with "ApplicationContext failure threshold exceeded" error when trying to run tests. This is a critical issue that prevents the test suite from running.

## Root Cause Analysis

### Primary Issue: @SpringBootTest vs @WebMvcTest

The original test was using `@SpringBootTest` which loads the **entire application context**, including:
- Database connections (Hibernate, Flyway)
- Redis cache configuration
- Elasticsearch configuration
- All filters (RateLimitFilter, DeprecationFilter, RequestContextFilter, TenantFilter, CorrelationIdFilter)
- All aspects (AuditAspect)
- Security configuration
- Mail sender configuration
- Keycloak admin client
- Task scheduling
- And many more...

This approach has several problems:
1. **Slow test execution**: Loading full context takes significant time
2. **Requires external dependencies**: Database, Redis, etc. must be available
3. **Context loading failures**: Missing beans or configuration errors cause cascading failures
4. **Not true unit testing**: Tests the entire stack instead of just the controller

### Secondary Issue: Missing Bean Definitions

When attempting to convert to `@WebMvcTest` (which only loads web layer), several required beans were missing:
1. **JwtDecoder**: Required by SecurityConfig for OAuth2 resource server
2. **CorrelationIdFilter**: Required by SecurityFilterChain
3. **TenantFilter**: Required for multi-tenant request handling
4. **ObjectMapper**: Required by TenantFilter for JSON serialization

### Tertiary Issue: Circular Dependency

The original SecurityConfig had a circular dependency:
```
SecurityFilterChain -> CorrelationIdFilter (injected as parameter)
    ↓
CorrelationIdFilter is a @Component that needs to be created before SecurityFilterChain
    ↓
But SecurityFilterChain is needed to configure the filter chain
    ↓
CIRCULAR DEPENDENCY!
```

## Solution Implemented

### 1. Converted to @WebMvcTest

Changed from:
```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(roles = "ADMIN")
```

To:
```java
@WebMvcTest(
    controllers = AnnonceController.class,
    excludeAutoConfiguration = { ... },
    excludeFilters = { ... }
)
@Import(AnnonceControllerTestConfiguration.class)
@TestPropertySource(properties = { ... })
@ActiveProfiles("test")
@WithMockUser(roles = "ADMIN")
```

### 2. Created Dedicated Test Configuration

Created `AnnonceControllerTestConfiguration` that provides:

#### a) Mock JwtDecoder
```java
@Bean
@Primary
public JwtDecoder jwtDecoder() {
    return token -> {
        // Returns mock JWT with ADMIN role
    };
}
```

#### b) Required Filters
```java
@Bean
public CorrelationIdFilter correlationIdFilter() { ... }

@Bean
public TenantFilter tenantFilter(ObjectMapper objectMapper) { ... }
```

#### c) Configured ObjectMapper
```java
@Bean
@Primary
public ObjectMapper objectMapper() {
    // Properly configured with JavaTimeModule
}
```

#### d) SecurityFilterChain with Circular Dependency Fix
```java
@Bean
public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        ObjectProvider<CorrelationIdFilter> correlationIdFilterProvider) {
    // Uses ObjectProvider to break circular dependency
}
```

### 3. Excluded Unnecessary Components

Excluded auto-configurations:
- `RedisAutoConfiguration`
- `ElasticsearchDataAutoConfiguration`
- `MailSenderAutoConfiguration`
- `DataSourceAutoConfiguration`
- `HibernateJpaAutoConfiguration`
- `FlywayAutoConfiguration`
- `TaskSchedulingAutoConfiguration`

Excluded filters:
- `RateLimitFilter`
- `DeprecationFilter`
- `RequestContextFilter`

Excluded configurations:
- All non-essential config classes (WebConfig, CacheConfig, AsyncConfig, etc.)
- `SecurityConfig` (replaced with test version)
- `MethodSecurityConfig` (enabled in test config)

### 4. Converted to Mock-Based Testing

Changed from using real database entities:
```java
// Before
Annonce annonce = createAnnonce(ORG_ID);
// Uses repository.save() - requires database

// After
when(annonceService.getById(testAnnonceId)).thenReturn(mockResponse);
// Uses mocks - no database needed
```

### 5. Added Detailed Error Logging

Added multiple logging points:
1. **Bean creation logging**: Logs each bean as it's created
2. **Context initialization logging**: Logs successful context load
3. **Context failure logging**: Logs detailed error information when context fails
4. **Test execution logging**: Logs each test method execution

## Benefits of the Fix

1. **Faster test execution**: No database, Redis, or other external dependencies
2. **True unit testing**: Tests only the controller layer in isolation
3. **Better error messages**: Detailed logging helps diagnose future issues
4. **No circular dependencies**: ObjectProvider pattern breaks the cycle
5. **Reduced complexity**: Only loads beans needed for controller testing
6. **More maintainable**: Clear separation between integration and unit tests

## Verification

To verify the fix works, the logs should show:
1. `AnnonceControllerTestConfiguration INITIALIZING`
2. Bean creation logs for each required bean (ObjectMapper, JwtDecoder, filters, SecurityFilterChain)
3. `APPLICATION CONTEXT LOADED SUCCESSFULLY`
4. Test execution logs for each test method

If context loading fails, the error logs will show:
1. `APPLICATION CONTEXT FAILED TO LOAD`
2. Exception type and message
3. Full stack trace
4. Nested cause chain (up to 5 levels deep)

## Testing Strategy

### Unit Tests (Controller Layer)
- Use `@WebMvcTest` for controller tests
- Mock all service dependencies
- Test only HTTP request/response handling
- Fast execution, no external dependencies

### Integration Tests (Full Stack)
- Use `@SpringBootTest` for end-to-end tests
- Test complete request flow through all layers
- Validate database operations, caching, security, etc.
- Located in `*BackendE2ETest.java` files

## Related Files

- `backend/src/test/java/com/example/backend/controller/AnnonceControllerTest.java`
- `backend/src/test/java/com/example/backend/controller/AnnonceControllerTestConfiguration.java`

## References

- Spring Boot Testing Documentation: https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing
- @WebMvcTest Documentation: https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/web/servlet/WebMvcTest.html
- Circular Dependency Resolution: https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html#beans-dependency-resolution
