# Backend E2E Testing Guide

## Overview

This guide explains how to write backend E2E tests with proper authentication and multi-tenancy support.

## Authentication in E2E Tests

All `/api/**` endpoints (except webhooks) require JWT authentication. The test infrastructure provides mock JWT support to simplify testing.

### Using Mock JWTs

The `BaseBackendE2ETest` class provides helper methods to create mock JWTs:

```java
@Test
public void testExample() throws Exception {
    mockMvc.perform(get("/api/v1/dossiers")
            .with(jwt().jwt(createMockJwt("ORG-001")))  // Add JWT authentication
            .header(TENANT_HEADER, "ORG-001")           // Add tenant header
            .header(CORRELATION_ID_HEADER, "test-corr-id"))
        .andExpect(status().isOk());
}
```

### Helper Methods

**`createMockJwt(String orgId)`**
- Creates a JWT with default subject "test-user" and role "ADMIN"
- Includes the specified `org_id` claim

**`createMockJwt(String orgId, String subject, String... roles)`**
- Creates a JWT with custom subject and roles
- Useful for testing role-based authorization

Example:
```java
Jwt proUserJwt = createMockJwt("ORG-001", "pro-user", "PRO");
Jwt adminJwt = createMockJwt("ORG-001", "admin-user", "ADMIN");
```

## Multi-Tenancy in E2E Tests

### TenantFilter Order

The `TenantFilter` runs at `HIGHEST_PRECEDENCE`, **before** the Spring Security filter chain. This ensures:
1. The `X-Org-Id` header is extracted first
2. `TenantContext` is set up before security validation
3. Cleanup happens in a finally block, even if security checks fail

### Required Headers

Both headers are required for most API endpoints:
- `X-Org-Id`: Organization identifier (tenant isolation)
- `Authorization: Bearer <token>`: JWT for authentication

Example:
```java
mockMvc.perform(post("/api/v1/dossiers")
        .with(jwt().jwt(createMockJwt("ORG-001")))
        .header(TENANT_HEADER, "ORG-001")
        .header(CORRELATION_ID_HEADER, "test-corr-id")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
    .andExpect(status().isCreated());
```

### X-Org-Id vs org_id Claim

- **X-Org-Id header**: Required by `TenantFilter` for tenant isolation
- **org_id claim**: Part of JWT, can be used for validation or auditing
- These are independent: the header is mandatory even if the JWT contains an org_id claim

### Testing Different Organizations

To test tenant isolation, use different org IDs:

```java
@Test
public void testTenantIsolation() throws Exception {
    // Create resource in ORG-001
    MvcResult result = mockMvc.perform(post("/api/v1/dossiers")
            .with(jwt().jwt(createMockJwt("ORG-001")))
            .header(TENANT_HEADER, "ORG-001")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
        .andExpect(status().isCreated())
        .andReturn();
    
    Long dossierId = extractId(result);
    
    // Try to access from ORG-002 - should return 404 (not 403)
    mockMvc.perform(get("/api/v1/dossiers/" + dossierId)
            .with(jwt().jwt(createMockJwt("ORG-002")))
            .header(TENANT_HEADER, "ORG-002"))
        .andExpect(status().isNotFound());  // Anti-enumeration
}
```

## Custom JWT Annotations

### @WithMockJwt

For tests that need Spring Security context but don't use MockMvc:

```java
@Test
@WithMockJwt(orgId = "ORG-001", roles = {"ADMIN"})
public void testWithSecurityContext() {
    // Security context is pre-configured
    // Note: Still need X-Org-Id header for TenantFilter
}
```

Attributes:
- `subject`: JWT subject (default: "test-user")
- `orgId`: Organization ID claim (default: "ORG-001")
- `roles`: User roles (default: ["ADMIN"])

## Configuration

### application-backend-e2e.yml

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: mock  # Enables mock JWT decoder
```

### TestSecurityConfig

The `TestSecurityConfig` provides a mock `JwtDecoder` that:
- Accepts any token value without validation
- Returns a pre-configured JWT with standard test claims
- Is automatically used when `issuer-uri: mock`

## Common Patterns

### Testing Unauthorized Access

```java
@Test
public void testUnauthorized() throws Exception {
    mockMvc.perform(get("/api/v1/dossiers")
            // No JWT provided
            .header(TENANT_HEADER, "ORG-001"))
        .andExpect(status().isUnauthorized());
}
```

### Testing Missing Tenant Header

```java
@Test
public void testMissingTenantHeader() throws Exception {
    mockMvc.perform(get("/api/v1/dossiers")
            .with(jwt().jwt(createMockJwt("ORG-001"))))
            // No X-Org-Id header
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value("Missing required header: X-Org-Id"));
}
```

### Testing Role-Based Access Control

```java
@Test
public void testProUserCannotDelete() throws Exception {
    Jwt proJwt = createMockJwt("ORG-001", "pro-user", "PRO");
    
    mockMvc.perform(delete("/api/v1/annonces/123")
            .with(jwt().jwt(proJwt))
            .header(TENANT_HEADER, "ORG-001"))
        .andExpect(status().isForbidden());
}

@Test
public void testAdminUserCanDelete() throws Exception {
    Jwt adminJwt = createMockJwt("ORG-001", "admin-user", "ADMIN");
    
    mockMvc.perform(delete("/api/v1/annonces/123")
            .with(jwt().jwt(adminJwt))
            .header(TENANT_HEADER, "ORG-001"))
        .andExpect(status().isNoContent());
}
```

## Filter Execution Order

1. **TenantFilter** (HIGHEST_PRECEDENCE)
   - Extracts X-Org-Id header
   - Sets TenantContext
   - Validates header presence
   
2. **Spring Security Filter Chain**
   - Validates JWT token
   - Checks authentication
   - Enforces authorization rules
   
3. **Controller/Service Layer**
   - Uses TenantContext for data filtering
   - Applies Hibernate filters automatically

## Best Practices

1. **Always include both headers**: X-Org-Id and Authorization
2. **Use helper methods**: Prefer `createMockJwt()` over manual JWT construction
3. **Test tenant isolation**: Verify 404 responses for cross-tenant access
4. **Test anti-enumeration**: Ensure 404 (not 403) for unauthorized access
5. **Clean up test data**: Use `@BeforeEach` to clear repositories
6. **Match org IDs**: Keep JWT org_id claim and X-Org-Id header consistent for clarity

## See Also

- `MultiTenantBackendE2ETest.java` - Comprehensive tenant isolation tests
- `SecurityBackendE2ETest.java` - Authentication and authorization tests
- `BaseBackendE2ETest.java` - Base class with helper methods
- `WithMockJwt.java` - Custom annotation for JWT security context
