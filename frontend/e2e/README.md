# E2E Tests with Playwright

This directory contains end-to-end tests for the frontend application using Playwright with **comprehensive API response validation**.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm run e2e
```

### Run tests in headed mode (see browser)
```bash
npm run e2e:headed
```

### Run tests in UI mode (interactive)
```bash
npm run e2e:ui
```

### Run specific test file
```bash
npx playwright test dossier-message.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Scenarios

### Scenario 1: Message Creation Flow (dossier-message.spec.ts)
Tests the complete flow of:
1. Login → Navigate to dossiers list
2. Open a dossier detail page
3. Switch to Messages tab
4. Add a new message
5. Verify the message appears in the timeline with correct:
   - Timestamp
   - Channel (EMAIL, SMS, etc.)
   - Direction (INBOUND/OUTBOUND)
   - Content
6. **API Validation**:
   - Validates HTTP status codes (200, 201)
   - Asserts X-Org-Id and X-Correlation-Id headers
   - Validates response body DTOs
   - Tests error scenarios (400, 403, 404)

### Scenario 2: Appointment Creation and Audit (dossier-appointment.spec.ts)
Tests the complete flow of:
1. Open a dossier
2. Switch to Rendez-vous (Appointments) tab
3. Add a new appointment
4. Verify the appointment appears in the list
5. Switch to Historique (Audit) tab
6. Verify audit event for appointment creation with:
   - action=CREATE (or CREATED)
   - entityType=APPOINTMENT (or related)
7. **API Validation**:
   - Validates appointment creation API responses
   - Tests invalid appointment time scenarios (400 errors)
   - Validates audit events API responses

### Scenario 3: Complete Workflow (dossier-full-workflow.spec.ts)
End-to-end workflow testing:
1. Create dossier → Add message → Add appointment → Verify audit trail
2. **Full API validation throughout the entire workflow**

### Scenario 4: Page Object Model Tests (dossier-pom.spec.ts)
Tests using Page Object Model pattern with API validation

## API Response Validation

All tests include comprehensive API validation using utilities from `api-validation.ts`:

### Key Features

#### 1. HTTP Status Code Validation
```typescript
await waitForApiCall(page, /\/api\/v1\/dossiers/, {
  expectedStatus: 201  // Validates status code
});
```

#### 2. Header Validation (X-Org-Id, X-Correlation-Id)
```typescript
import { validateRequestHeaders, validateResponseHeaders } from './api-validation';

validateRequestHeaders(request);  // Validates required request headers
validateResponseHeaders(headers); // Validates required response headers
```

#### 3. Response Body DTO Validation
```typescript
import { validateDossierResponse, validateMessageResponse } from './api-validation';

validateDossierResponse(body);    // Validates DossierResponse structure
validateMessageResponse(body);    // Validates MessageResponse structure
validateAppointmentResponse(body); // Validates AppointmentResponse structure
validateAuditEventResponse(body);  // Validates AuditEventResponse structure
validatePageResponse(body);        // Validates Spring Page structure
```

#### 4. Error Response Validation (RFC 7807 ProblemDetails)
```typescript
import { validateProblemDetails } from './api-validation';

validateProblemDetails(errorBody, 400); // Validates ProblemDetails structure
```

#### 5. User-Facing Error Message Validation
```typescript
import { validateErrorSnackbar } from './api-validation';

await validateErrorSnackbar(page, /contenu.*vide/i); // Verifies error message displayed
```

#### 6. Error Scenario Testing with page.route()
```typescript
// Mock 400 Bad Request
await page.route(/\/api\/v1\/messages$/, async (route) => {
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
        detail: 'Le contenu du message ne peut pas être vide',
        instance: '/api/v1/messages'
      })
    });
  } else {
    await route.continue();
  }
});
```

### Complete Example

```typescript
test('Create message with full API validation', async ({ page }) => {
  // Wait for and validate list API call
  const listPromise = waitForApiCall(page, /\/api\/v1\/messages\?/, {
    expectedStatus: 200,
    validateResponse: (body) => {
      validatePageResponse(body, validateMessageResponse);
      expect(body.content).toBeTruthy();
    }
  });
  
  await navigateToMessagesTab(page);
  
  // Verify list API call
  const { request: listRequest } = await listPromise;
  validateRequestHeaders(listRequest);

  // Fill message form
  await fillMessageForm(page, messageData);

  // Wait for and validate create API call
  const createPromise = waitForApiCall(page, /\/api\/v1\/messages$/, {
    expectedStatus: 201,
    validateResponse: (body) => {
      validateMessageResponse(body);
      expect(body.channel).toBe('EMAIL');
      expect(body.content).toBe(messageContent);
    }
  });
  
  await submitMessageForm(page);
  
  // Verify create API call
  const { request: createRequest, response } = await createPromise;
  validateRequestHeaders(createRequest);
  expect(response.id).toBeTruthy();
});
```

### Error Scenarios Tested

Each test suite includes validation for:
- ✅ **400 Bad Request** - Invalid input data (e.g., empty content, invalid time)
- ✅ **403 Forbidden** - Insufficient permissions
- ✅ **404 Not Found** - Resource not found

All error scenarios validate:
1. HTTP status code
2. Response headers (X-Org-Id, X-Correlation-Id)
3. RFC 7807 ProblemDetails structure
4. User-facing error messages in snackbar

## Test Structure

- `auth.fixture.ts` - Authentication fixture that automatically logs in before each test
- `helpers.ts` - Common helper functions for navigation, form filling, etc.
- **`api-validation.ts`** - **API validation utilities for comprehensive testing**
- `pages/` - Page Object Model classes
- `*.spec.ts` - Test specification files

## API Validation Utilities

See `api-validation.ts` for comprehensive documentation of validation functions:

- `validateRequestHeaders()` - Validates request headers
- `validateResponseHeaders()` - Validates response headers
- `validateDossierResponse()` - Validates DossierResponse DTO
- `validateMessageResponse()` - Validates MessageResponse DTO
- `validateAppointmentResponse()` - Validates AppointmentResponse DTO
- `validateAuditEventResponse()` - Validates AuditEventResponse DTO
- `validatePageResponse()` - Validates Spring Page response
- `validateProblemDetails()` - Validates RFC 7807 error response
- `validateErrorSnackbar()` - Validates user-facing error messages
- `waitForApiCall()` - Waits for and validates API calls
- `interceptApiRoute()` - Intercepts and validates API routes
- `mockErrorResponse()` - Mocks error responses for testing

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of the frontend directory.

Key configuration:
- Base URL: http://localhost:4200
- Browsers: Chromium, Firefox, WebKit
- Auto-start dev server before tests
- Screenshots on failure
- Trace on first retry

## Debugging

### Debug mode
```bash
npx playwright test --debug
```

### View test report
```bash
npx playwright show-report
```

### Generate trace for failed tests
Traces are automatically generated on first retry. View them with:
```bash
npx playwright show-trace trace.zip
```

### Debug API calls
```bash
DEBUG=pw:api npx playwright test
```

## CI/CD

Tests are configured to run in CI mode when the `CI` environment variable is set:
- Retries: 2 attempts on failure
- Workers: 1 (sequential execution)
- forbidOnly: true (prevents `.only` from being committed)

## Best Practices

1. **Always validate API responses** using utilities from `api-validation.ts`
2. **Test error scenarios** to ensure proper error handling
3. **Verify headers** (X-Org-Id, X-Correlation-Id) in all API calls
4. **Validate DTO structures** match backend specifications
5. Use data-testid attributes for stable selectors (recommended for production)
6. Wait for explicit conditions rather than fixed timeouts
7. Clean up test data after tests when possible
8. Use the authentication fixture to avoid repetitive login steps
9. Keep tests independent - each test should work in isolation
10. Use Page Object Model for complex interactions

## Test Coverage

✅ **API Response Validation:**
- HTTP status codes (200, 201, 400, 403, 404)
- Request headers (X-Org-Id, X-Correlation-Id)
- Response headers (X-Org-Id, X-Correlation-Id)
- Response body DTO validation
- RFC 7807 ProblemDetails for errors
- User-facing error messages

✅ **Functional Testing:**
- Dossier CRUD operations
- Message creation and display
- Appointment scheduling and management
- Audit trail tracking
- Error handling and user feedback

## Troubleshooting

### Test fails with "Timeout waiting for..."
- Increase timeout in the test or config
- Check if the application is running correctly
- Verify selectors are correct

### Authentication issues
- Check that the mock login button is available
- Verify the auth fixture is working correctly
- Check browser console for errors

### Element not found
- Use Playwright Inspector to debug selectors: `npx playwright test --debug`
- Try multiple selector strategies (text, role, test-id)
- Check if element is in a shadow DOM or iframe

### API validation failures
- Check network tab in browser DevTools
- Verify backend is returning expected response format
- Check that headers are being set correctly in interceptors
- Use DEBUG=pw:api for detailed API logging
