# Controller Test Execution Guide

## Overview

Controller tests use `@WebMvcTest` to test only the web layer in isolation. These are fast unit tests that mock all service dependencies and don't require external resources like databases, Redis, or Elasticsearch.

## Running the Tests

### Run Specific Test Class

```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn test -Dtest=AnnonceControllerTest
```

### Run Single Test Method

```powershell
mvn test -Dtest=AnnonceControllerTest#create_ValidRequest_Returns201WithCreatedEntity
```

### Run with Debug Logging

```powershell
mvn test -Dtest=AnnonceControllerTest -X
```

## Understanding the Logs

### Successful Context Loading

When the Spring context loads successfully, you'll see:

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

╔════════════════════════════════════════════════════════════════╗
║ APPLICATION CONTEXT LOADED SUCCESSFULLY                        ║
║ Bean count: XX                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

### Bean Creation Logging

Watch for these bean creation logs:

```
✓ Bean created: annonceController (type: AnnonceController)
✓ Bean created: annonceService (type: MockBean)
✓ Bean created: objectMapper (type: ObjectMapper)
✓ Bean created: jwtDecoder (type: Lambda$...)
✓ Bean created: correlationIdFilter (type: CorrelationIdFilter)
✓ Bean created: tenantFilter (type: TenantFilter)
✓ Bean created: securityFilterChain (type: SecurityFilterChain)
```

### Test Execution Logging

Each test logs its execution:

```
TEST: create_ValidRequest_Returns201WithCreatedEntity
TEST: create_MissingTitle_Returns400
TEST: getById_ExistingId_Returns200WithEntity
...
```

### Context Loading Failure

If the context fails to load, you'll see detailed error information:

```
╔════════════════════════════════════════════════════════════════╗
║ APPLICATION CONTEXT FAILED TO LOAD                             ║
╚════════════════════════════════════════════════════════════════╝
Exception type: org.springframework.beans.factory.BeanCreationException
Exception message: Error creating bean with name 'securityFilterChain'...
Full stack trace: ...
Caused by (depth 0): UnsatisfiedDependencyException - ...
Caused by (depth 1): NoSuchBeanDefinitionException - ...
```

## Common Issues and Solutions

### Issue: "No qualifying bean of type 'JwtDecoder'"

**Cause**: AnnonceControllerTestConfiguration is not being imported or JwtDecoder bean is not created.

**Solution**: Ensure `@Import(AnnonceControllerTestConfiguration.class)` is on the test class.

### Issue: "Circular dependency between 'securityFilterChain' and 'correlationIdFilter'"

**Cause**: SecurityFilterChain directly depends on CorrelationIdFilter instead of using ObjectProvider.

**Solution**: This is already fixed by using `ObjectProvider<CorrelationIdFilter>` in the configuration.

### Issue: "No qualifying bean of type 'ObjectMapper'"

**Cause**: ObjectMapper bean is not created or not marked as @Primary.

**Solution**: AnnonceControllerTestConfiguration provides @Primary ObjectMapper bean.

### Issue: "Could not find TenantFilter bean"

**Cause**: TenantFilter bean definition is missing.

**Solution**: AnnonceControllerTestConfiguration provides TenantFilter bean with ObjectMapper dependency.

### Issue: Tests fail with "Missing required header: X-Org-Id"

**Cause**: Tests are not using the `withHeaders()` helper method.

**Solution**: All API requests must use `withHeaders(post(...))` or `withHeaders(get(...))` to include required headers.

## Test Architecture

### @WebMvcTest vs @SpringBootTest

| Aspect | @WebMvcTest | @SpringBootTest |
|--------|-------------|-----------------|
| **Scope** | Web layer only | Full application |
| **Speed** | Fast (~seconds) | Slow (~10-30s) |
| **Database** | Not loaded | Full DB setup |
| **Dependencies** | Mocked | Real beans |
| **Use Case** | Unit testing controllers | Integration testing |

### Bean Configuration Strategy

1. **Exclude unnecessary auto-configurations**: Database, Redis, Elasticsearch, Mail, etc.
2. **Exclude heavy components**: Aspects, interceptors, complex configs
3. **Provide minimal beans**: Only what's needed for the controller to function
4. **Mock all services**: Controllers should only test HTTP layer, not business logic

### Test Data Strategy

1. **Use mock responses**: Create `AnnonceResponse` objects directly
2. **Mock service calls**: Use `when(service.method(...)).thenReturn(mockResponse)`
3. **Verify interactions**: Use `verify(service, times(1)).method(...)`
4. **No database access**: Tests should not touch the database

## Debugging Tips

### Enable Verbose Logging

Add to test properties:
```java
@TestPropertySource(properties = {
    "logging.level.org.springframework=DEBUG",
    "logging.level.org.springframework.security=TRACE"
})
```

### Check Bean Creation Order

The `testBeanPostProcessor` logs all bean creation. Look for the order:
1. ObjectMapper (first - needed by other beans)
2. JwtDecoder (needed by SecurityFilterChain)
3. CorrelationIdFilter (needed by SecurityFilterChain via ObjectProvider)
4. TenantFilter (needs ObjectMapper)
5. SecurityFilterChain (last - depends on all above)

### Identify Missing Beans

Look for errors like:
```
No qualifying bean of type 'X' available
```

This means you need to either:
1. Add the bean to AnnonceControllerTestConfiguration
2. Mock the bean with @MockBean in the test class
3. Exclude the component that requires the bean

## Performance Benchmarks

Expected execution times:

- **Context loading**: < 2 seconds
- **Single test**: < 100ms
- **Full test class**: < 5 seconds
- **All controller tests**: < 30 seconds

Compare to @SpringBootTest:
- **Context loading**: 10-30 seconds (first time)
- **Single test**: 100-500ms
- **Full test class**: 15-45 seconds (with context caching)

## Best Practices

1. **Always use withHeaders()**: Include X-Org-Id and X-Correlation-Id headers
2. **Mock all service calls**: Use `when(...).thenReturn(...)` for happy paths
3. **Mock exceptions**: Use `when(...).thenThrow(...)` for error cases
4. **Verify interactions**: Use `verify(...)` to ensure service was called
5. **Reset mocks**: Call `reset(...)` in `@BeforeEach` to ensure test isolation
6. **Log test execution**: Use `log.info("TEST: methodName")` at start of each test
7. **Create helper methods**: Use `createMockResponse()` to reduce duplication

## Migration from @SpringBootTest

If you have other controller tests using `@SpringBootTest`, follow this pattern:

### Before (Integration Test)
```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MyControllerTest {
    @Autowired private MyRepository repository;
    
    @Test
    void testMethod() {
        MyEntity entity = repository.save(new MyEntity());
        // test with real entity
    }
}
```

### After (Unit Test)
```java
@WebMvcTest(controllers = MyController.class)
@Import(MyControllerTestConfiguration.class)
class MyControllerTest {
    @MockBean private MyService service;
    
    @Test
    void testMethod() {
        when(service.create(...)).thenReturn(mockResponse);
        // test with mocked service
    }
}
```

## Related Documentation

- [Spring Testing Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)
- [MockMvc Documentation](https://docs.spring.io/spring-framework/reference/testing/spring-mvc-test-framework.html)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
