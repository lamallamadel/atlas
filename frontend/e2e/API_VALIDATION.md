# API Response Validation Guide

This guide explains how to use the API validation utilities in Playwright E2E tests.

## Overview

The `api-validation.ts` module provides comprehensive utilities to validate API responses in E2E tests, including:
- HTTP status codes
- Request/response headers (X-Org-Id, X-Correlation-Id)
- Response body DTO structures
- Error responses (RFC 7807 ProblemDetails)
- User-facing error messages

## Core Functions

### 1. Header Validation

#### validateRequestHeaders(request, expectOrgId?, expectCorrelationId?)
Validates that a request includes required headers.

```typescript
import { validateRequestHeaders } from './api-validation';

const { request } = await waitForApiCall(page, /\/api\/v1\/dossiers/);
validateRequestHeaders(request); // Validates both headers
validateRequestHeaders(request, true, false); // Only X-Org-Id
```

#### validateResponseHeaders(headers, expectOrgId?, expectCorrelationId?)
Validates that a response includes required headers.

```typescript
import { validateResponseHeaders } from './api-validation';

const response = await page.waitForResponse(url => url.includes('/api/v1/dossiers'));
validateResponseHeaders(response.headers());
```

### 2. DTO Validation

#### validateDossierResponse(response)
Validates DossierResponse structure.

```typescript
import { validateDossierResponse } from './api-validation';

const body = await response.json();
validateDossierResponse(body);
// Validates: id, orgId, status, createdAt, updatedAt
```

#### validateMessageResponse(response)
Validates MessageResponse structure.

```typescript
import { validateMessageResponse } from './api-validation';

validateMessageResponse(body);
// Validates: id, orgId, dossierId, channel, direction, content, timestamp, createdAt
```

#### validateAppointmentResponse(response)
Validates AppointmentResponse structure.

```typescript
import { validateAppointmentResponse } from './api-validation';

validateAppointmentResponse(body);
// Validates: id, orgId, dossierId, startTime, endTime, status, createdAt, updatedAt
```

#### validateAuditEventResponse(response)
Validates AuditEventResponse structure.

```typescript
import { validateAuditEventResponse } from './api-validation';

validateAuditEventResponse(body);
// Validates: id, orgId, entityType, entityId, action, createdAt
```

#### validatePageResponse(response, validateItem?)
Validates Spring Data Page response structure.

```typescript
import { validatePageResponse, validateDossierResponse } from './api-validation';

// Validate page structure
validatePageResponse(body);

// Validate page structure and each item
validatePageResponse(body, validateDossierResponse);
// Validates: content[], pageable, totalElements, totalPages, size, number
```

### 3. Error Validation

#### validateProblemDetails(problemDetails, expectedStatus?)
Validates RFC 7807 ProblemDetails error response.

```typescript
import { validateProblemDetails } from './api-validation';

const errorBody = await errorResponse.json();
validateProblemDetails(errorBody, 400);
// Validates: status, title or detail, optional: type, instance
```

#### validateErrorSnackbar(page, expectedMessage?)
Validates that an error message is displayed to the user.

```typescript
import { validateErrorSnackbar } from './api-validation';

// Check snackbar is visible
await validateErrorSnackbar(page);

// Check specific message
await validateErrorSnackbar(page, 'Le contenu ne peut pas être vide');

// Check with regex
await validateErrorSnackbar(page, /contenu.*vide|invalide/i);
```

### 4. Complete API Call Validation

#### waitForApiCall(page, urlPattern, options?)
Waits for an API call and validates it comprehensively.

```typescript
import { waitForApiCall, validateMessageResponse } from './api-validation';

const { request, response } = await waitForApiCall(page, /\/api\/v1\/messages$/, {
  expectedStatus: 201,
  expectOrgId: true,
  expectCorrelationId: true,
  validateResponse: (body) => {
    validateMessageResponse(body);
    expect(body.channel).toBe('EMAIL');
    expect(body.content).toBe(expectedContent);
  }
});

// Request and response headers are automatically validated
// Returns parsed response body and request object
```

**Options:**
- `expectedStatus` - Expected HTTP status code
- `expectOrgId` - Validate X-Org-Id header (default: true)
- `expectCorrelationId` - Validate X-Correlation-Id header (default: true)
- `validateResponse` - Custom validation function for response body

### 5. Route Interception

#### interceptApiRoute(page, urlPattern, options)
Intercepts API routes with automatic validation.

```typescript
import { interceptApiRoute } from './api-validation';

const { responses, requests } = await interceptApiRoute(
  page,
  /\/api\/v1\/dossiers/,
  {
    expectedStatus: 200,
    validateResponse: validateDossierResponse
  }
);

// All intercepted requests/responses are validated and stored
```

### 6. Error Mocking

#### mockErrorResponse(page, urlPattern, statusCode, problemDetails, method?)
Mocks an error response for testing.

```typescript
import { mockErrorResponse } from './api-validation';

await mockErrorResponse(
  page,
  /\/api\/v1\/messages$/,
  400,
  {
    type: 'about:blank',
    title: 'Bad Request',
    status: 400,
    detail: 'Le contenu du message ne peut pas être vide',
    instance: '/api/v1/messages'
  },
  'POST'
);
```

### 7. Complete Error Flow Validation

#### validateApiError(page, expectedStatus, expectedDetailPattern, expectedUserMessage?)
Validates complete error flow including user message.

```typescript
import { validateApiError } from './api-validation';

await validateApiError(
  page,
  400,
  /contenu.*vide/i,
  /erreur|invalide/i
);
// Validates: status code, headers, ProblemDetails, and snackbar message
```

## Common Patterns

### Pattern 1: List and Create Flow

```typescript
test('Create item with validation', async ({ page }) => {
  // Validate list API call
  const listPromise = waitForApiCall(page, /\/api\/v1\/items\?/, {
    expectedStatus: 200,
    validateResponse: (body) => validatePageResponse(body, validateItemResponse)
  });
  
  await navigateToItemsPage(page);
  const { request: listRequest } = await listPromise;
  validateRequestHeaders(listRequest);

  // Validate create API call
  const createPromise = waitForApiCall(page, /\/api\/v1\/items$/, {
    expectedStatus: 201,
    validateResponse: (body) => {
      validateItemResponse(body);
      expect(body.name).toBe(expectedName);
    }
  });
  
  await fillAndSubmitForm(page, formData);
  
  const { request: createRequest, response } = await createPromise;
  validateRequestHeaders(createRequest);
  expect(response.id).toBeTruthy();
});
```

### Pattern 2: Error Scenario Testing

```typescript
test('Test 400 error handling', async ({ page }) => {
  // Mock 400 error
  await page.route(/\/api\/v1\/items$/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        headers: {
          'X-Org-Id': 'ORG-001',
          'X-Correlation-Id': 'test-correlation-id'
        },
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'Invalid input data',
          instance: '/api/v1/items'
        })
      });
    } else {
      await route.continue();
    }
  });

  // Trigger the error
  await fillFormWithInvalidData(page);
  
  const errorResponsePromise = page.waitForResponse(
    response => response.url().includes('/api/v1/items') && response.status() === 400
  );
  
  await submitForm(page);
  
  // Validate error response
  const errorResponse = await errorResponsePromise;
  expect(errorResponse.status()).toBe(400);
  
  const errorHeaders = errorResponse.headers();
  expect(errorHeaders['x-org-id']).toBeTruthy();
  expect(errorHeaders['x-correlation-id']).toBeTruthy();
  
  const errorBody = await errorResponse.json();
  validateProblemDetails(errorBody, 400);
  expect(errorBody.detail).toContain('Invalid');
  
  // Validate user sees error message
  await validateErrorSnackbar(page, /invalide|erreur/i);
});
```

### Pattern 3: Multiple API Calls in Workflow

```typescript
test('Complete workflow with multiple API validations', async ({ page }) => {
  // Step 1: List
  const listPromise = waitForApiCall(page, /\/api\/v1\/dossiers\?/, {
    expectedStatus: 200,
    validateResponse: (body) => validatePageResponse(body)
  });
  
  await navigateToDossiers(page);
  await listPromise;

  // Step 2: Create
  const createPromise = waitForApiCall(page, /\/api\/v1\/dossiers$/, {
    expectedStatus: 201,
    validateResponse: validateDossierResponse
  });
  
  await createDossier(page, dossierData);
  const { response: dossier } = await createPromise;
  const dossierId = dossier.id;

  // Step 3: Add related item
  const addMessagePromise = waitForApiCall(page, /\/api\/v1\/messages$/, {
    expectedStatus: 201,
    validateResponse: (body) => {
      validateMessageResponse(body);
      expect(body.dossierId).toBe(dossierId);
    }
  });
  
  await addMessage(page, messageData);
  await addMessagePromise;

  // Step 4: Verify audit
  const auditPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?/, {
    expectedStatus: 200,
    validateResponse: (body) => {
      validatePageResponse(body, validateAuditEventResponse);
      expect(body.content.length).toBeGreaterThan(0);
    }
  });
  
  await navigateToAuditTab(page);
  await auditPromise;
});
```

## Error Scenarios

### 400 Bad Request
Test invalid input validation.

```typescript
test('400 - Invalid input', async ({ page }) => {
  await mockErrorResponse(page, /\/api\/v1\/items$/, 400, {
    title: 'Bad Request',
    status: 400,
    detail: 'Name cannot be empty'
  });
  
  // Submit invalid form
  await submitFormWithEmptyName(page);
  
  // Validate error
  await validateApiError(page, 400, /empty/i, /vide|invalide/i);
});
```

### 403 Forbidden
Test permission errors.

```typescript
test('403 - Insufficient permissions', async ({ page }) => {
  await mockErrorResponse(page, /\/api\/v1\/items$/, 403, {
    title: 'Forbidden',
    status: 403,
    detail: 'Insufficient permissions to create item'
  }, 'POST');
  
  await submitForm(page);
  
  await validateApiError(page, 403, /permissions/i, /droits|accès refusé/i);
});
```

### 404 Not Found
Test resource not found.

```typescript
test('404 - Resource not found', async ({ page }) => {
  await mockErrorResponse(page, /\/api\/v1\/items\/9999$/, 404, {
    title: 'Not Found',
    status: 404,
    detail: 'Item not found'
  }, 'GET');
  
  await page.evaluate(() => fetch('/api/v1/items/9999'));
  
  await validateApiError(page, 404, /not found/i);
});
```

## Best Practices

1. **Always validate headers** - Use `validateRequestHeaders` and `validateResponseHeaders`
2. **Validate DTO structure** - Use specific validators like `validateDossierResponse`
3. **Test all error scenarios** - 400, 403, 404, etc.
4. **Verify user feedback** - Use `validateErrorSnackbar` for error messages
5. **Use waitForApiCall** - Simplifies validation of complete API calls
6. **Mock errors with page.route()** - Test error handling without backend changes
7. **Validate ProblemDetails** - Ensure RFC 7807 compliance for errors

## TypeScript Types

```typescript
interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

interface ApiValidationOptions {
  expectedStatus?: number;
  expectOrgId?: boolean;
  expectCorrelationId?: boolean;
  validateResponse?: (body: any) => void;
  errorScenario?: {
    expectedStatus: number;
    expectedProblemDetails?: Partial<ProblemDetails>;
    shouldDisplayMessage?: boolean;
  };
}
```

## Examples in Test Files

- `dossier-full-workflow.spec.ts` - Complete workflow with API validation
- `dossier-message.spec.ts` - Message CRUD with error scenarios
- `dossier-appointment.spec.ts` - Appointment operations with validation
- `dossier-pom.spec.ts` - Page Object Model with API validation

## Resources

- [RFC 7807 - Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc7807)
- [Playwright Network Documentation](https://playwright.dev/docs/network)
- [Spring Data Page](https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Page.html)
