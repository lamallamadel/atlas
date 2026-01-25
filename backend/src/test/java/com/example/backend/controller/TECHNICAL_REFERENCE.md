# AnnonceControllerTest - Technical Reference

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AnnonceControllerTest                           │
│  @WebMvcTest(controllers = AnnonceController.class)                │
│  @Import(AnnonceControllerTestConfiguration.class)                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ imports
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│          AnnonceControllerTestConfiguration                         │
│  @TestConfiguration                                                 │
│  @EnableMethodSecurity(prePostEnabled = true)                      │
│                                                                     │
│  Provides Beans:                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ 1. ObjectMapper (@Primary)                                │   │
│  │    - JavaTimeModule                                        │   │
│  │    - Date/time serialization config                       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                            ↓ (used by)                             │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ 2. JwtDecoder (@Primary)                                  │   │
│  │    - Mock implementation                                   │   │
│  │    - Returns JWT with ADMIN role                          │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ 3. CorrelationIdFilter                                     │   │
│  │    - Extracts X-Correlation-Id header                     │   │
│  │    - Adds to MDC logging context                          │   │
│  └───────────────────────────────────────────────────────────┘   │
│                            ↓                                        │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ 4. TenantFilter                                            │   │
│  │    - Depends on ObjectMapper                               │   │
│  │    - Extracts X-Org-Id header                             │   │
│  │    - Sets TenantContext                                    │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ 5. SecurityFilterChain                                     │   │
│  │    - Uses ObjectProvider<CorrelationIdFilter> (breaks     │   │
│  │      circular dependency)                                  │   │
│  │    - Configures OAuth2 resource server                    │   │
│  │    - Uses JwtDecoder and JwtAuthenticationConverter       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Helper Beans:                                                     │
│  - BeanPostProcessor (logs bean creation)                          │
│  - ContextRefreshedListener (logs success)                         │
│  - ContextFailedListener (logs failures)                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ mocks
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Mocked Services                                │
│                                                                     │
│  @MockBean AnnonceService                                          │
│  @MockBean CursorPaginationService                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Bean Creation Order

The beans are created in this order (managed by Spring dependency resolution):

```
1. ObjectMapper
   ↓
2. JwtDecoder (no dependencies)
   ↓
3. CorrelationIdFilter (no dependencies)
   ↓
4. TenantFilter (depends on ObjectMapper)
   ↓
5. SecurityFilterChain (depends on ObjectProvider<CorrelationIdFilter>, uses JwtDecoder)
   ↓
6. AnnonceController (depends on AnnonceService, CursorPaginationService - both mocked)
```

## Circular Dependency Resolution

### The Problem

Original dependency graph:
```
SecurityFilterChain → CorrelationIdFilter (direct injection)
                           ↓
                  [Spring creates beans]
                           ↓
              SecurityFilterChain must exist first
                           ↓
                    CIRCULAR DEPENDENCY!
```

### The Solution

Modified dependency graph:
```
SecurityFilterChain → ObjectProvider<CorrelationIdFilter> (lazy injection)
                           ↓
                  [Spring creates beans]
                           ↓
              CorrelationIdFilter created independently
                           ↓
              SecurityFilterChain can request filter via provider
                           ↓
                    NO CIRCULAR DEPENDENCY!
```

### Code Pattern

```java
// ❌ CAUSES CIRCULAR DEPENDENCY
@Bean
public SecurityFilterChain chain(HttpSecurity http, CorrelationIdFilter filter) {
    // Direct dependency on filter
}

// ✅ BREAKS CIRCULAR DEPENDENCY
@Bean
public SecurityFilterChain chain(HttpSecurity http, ObjectProvider<CorrelationIdFilter> filterProvider) {
    CorrelationIdFilter filter = filterProvider.getIfAvailable();
    // Lazy resolution of filter
}
```

## Component Exclusion Strategy

### Excluded Auto-Configurations (7)

| Auto-Configuration | Reason |
|-------------------|---------|
| RedisAutoConfiguration | No caching in unit tests |
| ElasticsearchDataAutoConfiguration | No search in unit tests |
| MailSenderAutoConfiguration | No email in unit tests |
| DataSourceAutoConfiguration | No database in unit tests |
| HibernateJpaAutoConfiguration | No JPA in unit tests |
| FlywayAutoConfiguration | No migrations in unit tests |
| TaskSchedulingAutoConfiguration | No scheduled tasks in unit tests |

### Excluded Component Filters (22)

| Component | Reason | Impact |
|-----------|--------|--------|
| RateLimitFilter | Not needed for controller tests | No rate limiting |
| DeprecationFilter | Not needed for controller tests | No deprecation headers |
| RequestContextFilter | Not needed for controller tests | No slow request logging |
| AuditAspect | Not needed for controller tests | No audit events |
| WebConfig | Requires EntityManagerFactory | No web config |
| HibernateFilterInterceptor | Requires EntityManagerFactory | No Hibernate filters |
| ElasticsearchConfig | Not needed for unit tests | No search |
| CacheConfig | Not needed for unit tests | No caching |
| AsyncConfig | Not needed for unit tests | No async |
| KeycloakAdminConfig | Not needed for unit tests | No Keycloak admin |
| NotificationConfig | Not needed for unit tests | No mail sender |
| OutboundConfig | Not needed for unit tests | No outbound messaging |
| RateLimitConfig | Not needed for unit tests | No rate limit config |
| Resilience4jConfig | Not needed for unit tests | No circuit breakers |
| StorageConfig | Not needed for unit tests | No file storage |
| JpaAuditingConfig | Not needed for unit tests | No JPA auditing |
| ApiVersionRequestMappingHandlerMapping | Not needed for unit tests | No version mapping |
| StartupIndexAuditListener | Not needed for unit tests | No index auditing |
| JacksonConfig | Replaced with test version | Using test ObjectMapper |
| SecurityConfig | Replaced with test version | Using test SecurityFilterChain |
| MethodSecurityConfig | Replaced with test version | Using test @EnableMethodSecurity |
| OpenApiConfig | Not needed for unit tests | No Swagger/OpenAPI |

## Test Configuration Properties

| Property | Value | Purpose |
|----------|-------|---------|
| spring.security.oauth2.resourceserver.jwt.issuer-uri | mock | Use mock JWT decoder |
| elasticsearch.enabled | false | Disable Elasticsearch |
| cache.redis.enabled | false | Disable Redis cache |
| rate-limit.enabled | false | Disable rate limiting |
| outbound.worker.enabled | false | Disable outbound worker |
| outbound.alert.enabled | false | Disable outbound alerts |
| database.index-audit.enabled | false | Disable index auditing |
| spring.mail.enabled | false | Disable mail sender |
| spring.task.scheduling.enabled | false | Disable scheduling |
| spring.cache.type | none | Disable caching |
| logging.level.com.example.backend | DEBUG | Enable debug logging |
| logging.level.TEST_BEAN_CREATION | INFO | Enable bean creation logs |
| logging.level.TEST_CONTEXT | INFO | Enable context logs |
| logging.level.TEST_CONTEXT_ERROR | ERROR | Enable error logs |

## Mock Service Strategy

### Pattern for All Tests

```java
@Test
void testMethod() {
    // 1. ARRANGE: Setup mock
    when(service.method(args)).thenReturn(mockResponse);
    
    // 2. ACT: Perform request
    mockMvc.perform(withHeaders(get("/api/v1/endpoint")))
        .andExpect(status().isOk());
    
    // 3. ASSERT: Verify interaction
    verify(service, times(1)).method(args);
}
```

### Validation Tests (No Service Call)

```java
@Test
void testValidation() {
    // Validation happens at controller level via @Valid
    // No need to mock service
    
    mockMvc.perform(withHeaders(post("/api/v1/endpoint")
            .content(invalidRequest)))
        .andExpect(status().isBadRequest());
    
    // Service should NEVER be called
    verify(service, never()).method(any());
}
```

## Logging Output Guide

### Successful Context Load

```
╔════════════════════════════════════════════════════════════════╗
║ AnnonceControllerTestConfiguration INITIALIZING               ║
║ This configuration provides all beans needed for @WebMvcTest  ║
╚════════════════════════════════════════════════════════════════╝

✓ Creating ObjectMapper for AnnonceControllerTest
✓ ObjectMapper configured successfully with JavaTimeModule

✓ Creating mock JwtDecoder for AnnonceControllerTest

✓ Creating CorrelationIdFilter for AnnonceControllerTest

✓ Creating TenantFilter for AnnonceControllerTest with ObjectMapper

✓ Creating SecurityFilterChain for AnnonceControllerTest
✓ SecurityFilterChain configured successfully

✓ Bean created: annonceController (type: AnnonceController)
✓ Bean created: objectMapper (type: ObjectMapper)

╔════════════════════════════════════════════════════════════════╗
║ APPLICATION CONTEXT LOADED SUCCESSFULLY                        ║
║ Bean count: XX                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

### Test Execution

```
Setting up AnnonceControllerTest
Test setup complete - mock response: AnnonceResponse(id=1, ...)

TEST: create_ValidRequest_Returns201WithCreatedEntity
TEST: create_MissingTitle_Returns400
TEST: getById_ExistingId_Returns200WithEntity
...

[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0
```

### Failed Context Load (If Issues Occur)

```
╔════════════════════════════════════════════════════════════════╗
║ APPLICATION CONTEXT FAILED TO LOAD                             ║
╚════════════════════════════════════════════════════════════════╝
Exception type: BeanCreationException
Exception message: Error creating bean with name 'X'...
Full stack trace: ...
Caused by (depth 0): UnsatisfiedDependencyException - ...
Caused by (depth 1): NoSuchBeanDefinitionException - No qualifying bean of type 'Y'
```

## Performance Metrics

| Metric | @SpringBootTest | @WebMvcTest | Improvement |
|--------|----------------|-------------|-------------|
| Context load time | 10-30s | < 2s | 80-95% faster |
| Test execution time | 15-45s | < 5s | 70-90% faster |
| Memory usage | ~500MB | ~100MB | 80% less |
| External dependencies | Database, Redis, etc. | None | 100% eliminated |

## Bean Dependencies Graph

```
ObjectMapper (created first, no dependencies)
    ├─→ TenantFilter (depends on ObjectMapper)
    └─→ ... (other components)

JwtDecoder (created independently)
    └─→ SecurityFilterChain (uses JwtDecoder)

CorrelationIdFilter (created independently)
    └─→ SecurityFilterChain (uses via ObjectProvider)

SecurityFilterChain (created last)
    ├─→ ObjectProvider<CorrelationIdFilter> (lazy)
    ├─→ JwtDecoder (direct)
    └─→ JwtAuthenticationConverter (internal)

AnnonceController (web layer)
    ├─→ AnnonceService (@MockBean)
    └─→ CursorPaginationService (@MockBean)
```

## Test Isolation Guarantees

✅ **No database access** - Repository beans not loaded  
✅ **No Redis access** - Cache auto-configuration excluded  
✅ **No Elasticsearch access** - Search auto-configuration excluded  
✅ **No email sending** - Mail auto-configuration excluded  
✅ **No scheduled tasks** - Task scheduling excluded  
✅ **No async operations** - AsyncConfig excluded  
✅ **No rate limiting** - RateLimitFilter excluded  
✅ **No audit logging** - AuditAspect excluded  

## Mock Verification Patterns

### Service Called Once
```java
verify(annonceService, times(1)).create(any(AnnonceCreateRequest.class));
```

### Service Never Called (Validation Failures)
```java
verify(annonceService, never()).create(any());
```

### Service Called with Specific Arguments
```java
verify(annonceService, times(1)).getById(eq(testAnnonceId));
```

### Service Called with Null Arguments
```java
verify(annonceService, times(1)).list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
```

### Service Called with Mixed Arguments
```java
verify(annonceService, times(1)).list(
    eq(AnnonceStatus.PUBLISHED), 
    eq("Electronics"), 
    isNull(), 
    isNull(), 
    any(Pageable.class)
);
```

## Error Handling Patterns

### Mock Service Exception
```java
when(annonceService.getById(999L))
    .thenThrow(new EntityNotFoundException("Annonce not found"));

mockMvc.perform(withHeaders(get("/api/v1/annonces/999")))
    .andExpect(status().isNotFound());
```

### Validation Exception (Automatic)
```java
// Controller has @Valid annotation, so validation happens automatically
// No need to mock service - just verify it's never called

createRequest.setTitle(null);  // Violates @NotBlank

mockMvc.perform(withHeaders(post("/api/v1/annonces")
        .content(objectMapper.writeValueAsString(createRequest))))
    .andExpect(status().isBadRequest());

verify(annonceService, never()).create(any());
```

## Security Testing Patterns

### Authenticated Request (Default)
```java
@WithMockUser(roles = "ADMIN")  // Class-level annotation
@Test
void testMethod() {
    // All requests in this test have ADMIN role
}
```

### Unauthenticated Request
```java
@Test
@WithAnonymousUser
void testUnauthorized() {
    mockMvc.perform(get("/api/v1/annonces"))
        .andExpect(status().isUnauthorized());
}
```

### Different Role
```java
@Test
@WithMockUser(roles = "USER")
void testForbidden() {
    mockMvc.perform(delete("/api/v1/annonces/1"))
        .andExpect(status().isForbidden());
}
```

## Request Header Patterns

### Standard Request (All Headers)
```java
mockMvc.perform(withHeaders(get("/api/v1/annonces")))
```

Expands to:
```java
mockMvc.perform(get("/api/v1/annonces")
    .header("X-Org-Id", "org123")
    .header("X-Correlation-Id", "test-correlation-id"))
```

### Missing Tenant Header Test
```java
mockMvc.perform(post("/api/v1/annonces")
    .header("X-Correlation-Id", CORRELATION_ID)
    // X-Org-Id deliberately omitted
    .content(...))
    .andExpect(status().isBadRequest());
```

## Response Validation Patterns

### JSON Path Assertions
```java
.andExpect(jsonPath("$.id").exists())
.andExpect(jsonPath("$.orgId").value(ORG_ID))
.andExpect(jsonPath("$.title").value("Test Annonce"))
.andExpect(jsonPath("$.status").value("DRAFT"))
```

### Content Type Assertion
```java
.andExpect(content().contentType(MediaType.APPLICATION_JSON))
```

### Header Assertion
```java
.andExpect(header().string(CORRELATION_ID_HEADER, CORRELATION_ID))
```

### Array/Collection Assertions
```java
.andExpect(jsonPath("$.content", hasSize(2)))
.andExpect(jsonPath("$.totalElements").value(2))
.andExpect(jsonPath("$.content[0].title").value("Annonce A"))
```

## Common Testing Scenarios

### Create Entity
```java
@Test
void create_ValidRequest_Returns201() {
    when(service.create(any())).thenReturn(mockResponse);
    
    mockMvc.perform(withHeaders(post("/api/v1/annonces")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists());
    
    verify(service, times(1)).create(any());
}
```

### Get Entity
```java
@Test
void getById_Exists_Returns200() {
    when(service.getById(1L)).thenReturn(mockResponse);
    
    mockMvc.perform(withHeaders(get("/api/v1/annonces/1")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1));
    
    verify(service, times(1)).getById(1L);
}
```

### Get Not Found
```java
@Test
void getById_NotFound_Returns404() {
    when(service.getById(999L))
        .thenThrow(new EntityNotFoundException("Not found"));
    
    mockMvc.perform(withHeaders(get("/api/v1/annonces/999")))
        .andExpect(status().isNotFound());
    
    verify(service, times(1)).getById(999L);
}
```

### Update Entity
```java
@Test
void update_ValidRequest_Returns200() {
    when(service.update(eq(1L), any())).thenReturn(updatedResponse);
    
    mockMvc.perform(withHeaders(put("/api/v1/annonces/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(updateRequest))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Updated"));
    
    verify(service, times(1)).update(eq(1L), any());
}
```

### List with Filters
```java
@Test
void list_WithFilter_ReturnsFiltered() {
    Page<AnnonceResponse> page = new PageImpl<>(
        Collections.singletonList(mockResponse), 
        PageRequest.of(0, 20), 
        1
    );
    when(service.list(eq(AnnonceStatus.PUBLISHED), isNull(), isNull(), isNull(), any()))
        .thenReturn(page);
    
    mockMvc.perform(withHeaders(get("/api/v1/annonces")
            .param("status", "PUBLISHED")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)));
    
    verify(service, times(1)).list(eq(AnnonceStatus.PUBLISHED), isNull(), isNull(), isNull(), any());
}
```

### Pagination
```java
@Test
void list_WithPagination_ReturnsPage() {
    List<AnnonceResponse> responses = Arrays.asList(/* 10 items */);
    Page<AnnonceResponse> page = new PageImpl<>(
        responses, 
        PageRequest.of(1, 10), 
        25  // total elements
    );
    when(service.list(any(), any(), any(), any(), any())).thenReturn(page);
    
    mockMvc.perform(withHeaders(get("/api/v1/annonces")
            .param("page", "1")
            .param("size", "10")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.number").value(1))
        .andExpect(jsonPath("$.size").value(10))
        .andExpect(jsonPath("$.totalElements").value(25));
}
```

## Debugging Checklist

When tests fail, check in order:

1. **Context Loading**
   - [ ] Look for "APPLICATION CONTEXT LOADED SUCCESSFULLY"
   - [ ] If not found, check for "APPLICATION CONTEXT FAILED TO LOAD"
   - [ ] Review the exception type and message

2. **Bean Creation**
   - [ ] Verify all required beans are created
   - [ ] Check bean creation order
   - [ ] Look for missing bean errors

3. **Mock Setup**
   - [ ] Verify `when(...).thenReturn(...)` is called
   - [ ] Check mock data matches test expectations
   - [ ] Ensure mocks are reset in @BeforeEach

4. **Request Execution**
   - [ ] Verify headers are included via withHeaders()
   - [ ] Check request content is properly serialized
   - [ ] Verify content type is set

5. **Response Validation**
   - [ ] Check status code expectation
   - [ ] Verify JSON path assertions
   - [ ] Check header assertions

6. **Interaction Verification**
   - [ ] Verify service method was called (or not called)
   - [ ] Check call count matches expectation
   - [ ] Verify argument matchers are correct

## Migration Template

To convert other controller tests from @SpringBootTest to @WebMvcTest:

```java
// 1. Change class annotations
@WebMvcTest(controllers = XController.class)
@Import(XControllerTestConfiguration.class)  // Or reuse AnnonceControllerTestConfiguration
@TestPropertySource(properties = {...})
@ActiveProfiles("test")
@WithMockUser(roles = "ADMIN")
class XControllerTest {

    // 2. Replace repository with service mock
    // @Autowired private XRepository repository;  // REMOVE
    @MockBean private XService service;  // ADD

    // 3. Update test methods
    @Test
    void testMethod() {
        // BEFORE: XEntity entity = repository.save(new XEntity());
        // AFTER: when(service.create(...)).thenReturn(mockResponse);
        
        // ... perform request
        
        // ADD: verify(service, times(1)).create(...);
    }
    
    // 4. Update helper methods
    // BEFORE: private XEntity createEntity() { return repository.save(...); }
    // AFTER: private XResponse createMockResponse() { return new XResponse(); }
}
```

## References

- **Quick Start**: README.md
- **Problem Analysis**: ANNONCE_CONTROLLER_TEST_FIX.md
- **Testing Guide**: TESTING_GUIDE_CONTROLLER_TESTS.md
- **Implementation Details**: IMPLEMENTATION_SUMMARY.md
- **Change Tracking**: CHANGES_CHECKLIST.md
- **Technical Reference**: This file

## Quick Commands

```powershell
# Run tests
mvn test -Dtest=AnnonceControllerTest

# Run with debug
mvn test -Dtest=AnnonceControllerTest -X

# Run single test
mvn test -Dtest=AnnonceControllerTest#create_ValidRequest_Returns201WithCreatedEntity

# Clean and test
mvn clean test -Dtest=AnnonceControllerTest
```
