# Multi-Tenant Backend E2E Test Implementation

## Overview

The `MultiTenantBackendE2ETest` class has been implemented to provide comprehensive end-to-end testing coverage for multi-tenant functionality in the backend application.

## Test Coverage

### 1. Create Identical Entities in Different Organizations
**Test Method:** `testCreateIdenticalEntitiesInDifferentOrgs()`
- Creates the same dossier structure in ORG-001 and ORG-002
- Verifies entities have unique IDs
- Confirms orgId is correctly set for each tenant

### 2. Anti-Enumeration: 404 Response for Wrong Tenant
**Test Methods:** 
- `testGetWithWrongOrgIdReturns404()`
- `testAntiEnumerationReturns404Not403()`

These tests verify that:
- Accessing a resource with the wrong X-Org-Id header returns 404 (not 403)
- This prevents enumeration attacks by not revealing whether resources exist in other tenants
- Non-existent resources also return 404, maintaining consistency

### 3. Missing X-Org-Id Header Validation
**Test Method:** `testMissingOrgIdHeaderReturns400WithProblemDetails()`

Verifies that:
- Requests without X-Org-Id header return 400 Bad Request
- Response is in RFC 7807 ProblemDetail format
- Detail message is exactly: "Missing required header: X-Org-Id"
- Title is "Bad Request"
- Status is 400

### 4. TenantContext ThreadLocal Management
**Test Methods:**
- `testTenantContextThreadLocalInjectionAndCleanup()`
- `testTenantFilterInjectsAndCleansUpInFinallyBlock()`

These tests verify that:
- TenantFilter injects orgId into TenantContext ThreadLocal
- Context is properly cleared in the finally block after request processing
- Context remains clean between requests (no leakage)
- Cleanup happens even if exceptions occur

### 5. Repository @Where Clause Filtering
**Test Method:** `testRepositoryWhereClauseFiltering()`

This test:
- Creates dossiers in both ORG-001 and ORG-002
- Manually enables Hibernate's orgIdFilter
- Verifies repository queries only return entities for the active tenant
- Confirms the @Filter annotation on entities works correctly
- Tests with multiple entities per tenant

### 6. Audit Events Scoped to Correct OrgId
**Test Methods:**
- `testAuditEventsScopedToCorrectOrgId()`
- `testAuditEventsIsolatedByOrgId()`

These tests verify that:
- Audit events are created with the correct orgId
- Each tenant's audit events are isolated from others
- Audit events contain proper diff information
- Entity type, entity ID, and action are correctly recorded
- Filter-based queries correctly isolate audit events by tenant

## Infrastructure Components

### 1. TenantFilter
Located: `backend/src/main/java/com/example/backend/filter/TenantFilter.java`
- Validates X-Org-Id header presence
- Injects orgId into TenantContext ThreadLocal
- Clears context in finally block
- Returns 400 ProblemDetail for missing header
- Excludes webhook endpoints from tenant validation

### 2. TenantContext
Located: `backend/src/main/java/com/example/backend/util/TenantContext.java`
- Thread-safe ThreadLocal storage for orgId
- Provides setOrgId(), getOrgId(), and clear() methods
- Includes backward-compatible tenantId aliases

### 3. HibernateFilterInterceptor
Located: `backend/src/main/java/com/example/backend/config/HibernateFilterInterceptor.java`
- Automatically enables orgIdFilter for API requests
- Sets filter parameter from TenantContext
- Disables filter after request completion

### 4. AuditAspect
Located: `backend/src/main/java/com/example/backend/aspect/AuditAspect.java`
- Captures audit events for create/update/delete/patch operations
- Automatically sets orgId from TenantContext
- Records before/after states with minimal diff

### 5. Entity Annotations
All multi-tenant entities include:
```java
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
```

Entities covered:
- Dossier
- AuditEventEntity
- PartiePrenanteEntity
- AppointmentEntity

### 6. BaseEntity
Located: `backend/src/main/java/com/example/backend/entity/BaseEntity.java`
- Defines @FilterDef for orgIdFilter
- Provides orgId field for all entities

### 7. Service Layer
All services validate tenant access:
- Get orgId from TenantContext
- Verify entity orgId matches request orgId
- Throw EntityNotFoundException for 404 (anti-enumeration)
- Set orgId on newly created entities

## Test Configuration

### Profile: backend-e2e
Configuration files:
- `application-backend-e2e.yml` - Main test configuration
- `application-backend-e2e-h2.yml` - H2 in-memory database

### Test Annotation: @BackendE2ETest
Located: `backend/src/test/java/com/example/backend/annotation/BackendE2ETest.java`
- Configures Spring Boot test with random port
- Enables MockMvc
- Activates backend-e2e profile
- Enables transactional test support

### Base Test Class: BaseBackendE2ETest
Located: `backend/src/test/java/com/example/backend/annotation/BaseBackendE2ETest.java`
- Provides tenant header constants
- Includes helper methods for building headers
- Provides assertion helpers for ProblemDetail responses

## Changes Made

### Fixed Issue
**File:** `backend/src/test/java/com/example/backend/MultiTenantBackendE2ETest.java`
**Line:** 386-387

**Before:**
```java
.andExpect(status().isNotFound())
.andExpect(status().isNotFound());
```

**After:**
```java
.andExpect(status().isNotFound());
```

Removed duplicate assertion that was redundant.

## Running the Tests

To run the multi-tenant E2E tests:

```bash
cd backend
mvn test -Dtest=MultiTenantBackendE2ETest
```

To run all E2E tests:
```bash
mvn test -Dgroups=backend-e2e
```

## Key Design Decisions

1. **404 for Wrong Tenant (Anti-Enumeration):** Returns 404 instead of 403 to prevent attackers from discovering which resource IDs exist across tenants.

2. **ThreadLocal Cleanup in Finally Block:** Ensures context is always cleared, preventing thread pool contamination and tenant data leakage.

3. **Automatic Filter Activation:** HibernateFilterInterceptor automatically enables filters for all API requests, reducing boilerplate and preventing missed filtering.

4. **Service-Level Validation:** Double validation (filter + service check) provides defense in depth for multi-tenant security.

5. **Audit Events Include OrgId:** All audit events are scoped to tenants, enabling proper audit trails per organization.

## Security Considerations

- All API endpoints require X-Org-Id header (except webhooks)
- Hibernate filter provides database-level tenant isolation
- Service layer validates tenant access before operations
- Anti-enumeration protection prevents resource discovery
- ThreadLocal cleanup prevents cross-tenant data leakage
- Audit events maintain per-tenant isolation

## Test Execution Flow

1. TenantFilter validates X-Org-Id header
2. TenantFilter sets TenantContext.orgId
3. HibernateFilterInterceptor enables Hibernate filter
4. Service validates orgId matches entity
5. Repository query filtered by orgId
6. AuditAspect captures event with orgId
7. TenantFilter clears context in finally block
8. HibernateFilterInterceptor disables filter

## Conclusion

The MultiTenantBackendE2ETest provides comprehensive coverage of multi-tenant functionality, ensuring proper tenant isolation at all layers of the application: filter, context, repository, service, and audit.
