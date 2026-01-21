# E2E Test Stabilization - Quick Reference

## Import Statement

```typescript
import { test, expect } from './stable-test-fixture';
```

## Test Structure Template

```typescript
test.describe('My Test Suite', () => {
  test.beforeEach(async ({ page, helpers }) => {
    await helpers.retryAssertion(async () => {
      await page.goto('/');
      await page.waitForSelector('app-root', { timeout: 10000 });
    });
  });

  test.afterEach(async ({ dataCleanup }) => {
    await dataCleanup.fullCleanup();
  });

  test('My test', async ({ page, helpers, dataCleanup }) => {
    // Test code here
  });
});
```

## Common Patterns

### Navigation
```typescript
// Navigate to dossiers
await helpers.navigateToDossiers();

// Navigate to annonces
await helpers.navigateToAnnonces();

// Switch tabs
await helpers.switchToTab('Messages');
```

### Waiting
```typescript
// Wait for selector
await helpers.waitForSelector('.my-element', { timeout: 10000 });

// Wait for API response
const { response, body } = await helpers.waitForApiResponse(
  /\/api\/v1\/resource/,
  { expectedStatus: 200 }
);

// Wait for dialog
await helpers.waitForDialog();
```

### Retry Logic
```typescript
// Retry assertion
await helpers.retryAssertion(async () => {
  await expect(element).toBeVisible();
}, {
  maxAttempts: 3,
  delayMs: 500,
  backoffMultiplier: 2
});

// Retry operation
const result = await helpers.retryOperation(async () => {
  return await someFlakyOperation();
});
```

### Data Cleanup
```typescript
// Track entities for cleanup
dataCleanup.trackDossier(dossierId);
dataCleanup.trackAnnonce(annonceId);
dataCleanup.trackMessage(messageId);
dataCleanup.trackAppointment(appointmentId);
dataCleanup.trackPartiePrenante(partieId);
dataCleanup.trackConsentement(consentementId);

// Manual cleanup (rarely needed - automatic in afterEach)
await dataCleanup.cleanupAll();
```

### User Management
```typescript
// Get current user
const user = await userManager.getCurrentUser();

// Create test user
const newUser = await userManager.createTestUser({
  username: 'custom-user',
  orgId: 'CUSTOM-ORG',
  roles: ['ADMIN']
});

// Switch user
await userManager.switchToUser(newUser);
```

### Dialogs & Snackbars
```typescript
// Wait for and close snackbar
await helpers.closeSnackbar();

// Wait for dialog
await helpers.waitForDialog();
```

### Utilities
```typescript
// Format datetime
const formatted = helpers.formatDateTimeLocal(new Date());

// Extract IDs
const dossierId = helpers.extractDossierId(page.url());
const annonceId = helpers.extractAnnonceId(page.url());

// Screenshot on failure
try {
  await operation();
} catch (error) {
  await helpers.takeScreenshotOnFailure('operation-name', error);
  throw error;
}
```

## Replace These Patterns

### ❌ Don't Use
```typescript
// Fixed timeout
await page.waitForTimeout(1000);

// Direct helper calls
import { navigateToDossiers } from './helpers';
await navigateToDossiers(page);

// No cleanup
// test creates data but doesn't clean up

// Single-attempt assertions
await expect(element).toBeVisible();

// Shared authentication
import { test } from './auth.fixture';
```

### ✅ Use Instead
```typescript
// Proper wait
await helpers.waitForSelector('.element');

// Fixture methods
await helpers.navigateToDossiers();

// Track for cleanup
dataCleanup.trackDossier(id);

// Retry assertion
await helpers.retryAssertion(async () => {
  await expect(element).toBeVisible();
});

// Isolated test user
import { test } from './stable-test-fixture';
```

## API Response Pattern

```typescript
// Create entity with proper wait
const createPromise = helpers.waitForApiResponse(/\/api\/v1\/entities$/, {
  expectedStatus: 201
});

await submitButton.click();

const { body: entity } = await createPromise;
expect(entity.id).toBeTruthy();
dataCleanup.trackEntity(entity.id);
```

## Error Handling Pattern

```typescript
test('Handle error', async ({ page, helpers }) => {
  // Mock error response
  await page.route(/\/api\/v1\/resource/, async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'Error message'
      })
    });
  });

  // Trigger error
  const errorPromise = page.waitForResponse(
    resp => resp.url().includes('/api/v1/resource') && resp.status() === 400
  );

  await submitButton.click();

  const error = await errorPromise;
  expect(error.status()).toBe(400);

  // Verify error snackbar
  await helpers.retryAssertion(async () => {
    const snackbar = page.locator('.mat-mdc-snack-bar-container');
    await expect(snackbar).toBeVisible({ timeout: 5000 });
  });
});
```

## Common Selectors

```typescript
// Buttons
'button:has-text("Créer")'
'button:has-text("Nouveau")'
'button:has-text("Planifier")'
'button[type="submit"]'

// Tabs
'div.mat-mdc-tab-label-content:has-text("Messages")'
'.mat-tab-label:has-text("Rendez-vous")'

// Dialogs
'mat-dialog-container'
'.dialog-container'

// Snackbars
'.mat-mdc-snack-bar-container'
'.snackbar'

// Tables
'table.data-table tbody tr'
'app-generic-table table tbody tr'

// Forms
'input#fieldName'
'input[name="fieldName"]'
'select#fieldName'
'textarea#fieldName'
```

## Retry Options

```typescript
{
  maxAttempts: 3,           // Number of retry attempts
  delayMs: 500,             // Initial delay in milliseconds
  backoffMultiplier: 2,     // Exponential backoff multiplier
  timeout: 30000            // Overall timeout in milliseconds
}
```

## Debug Tips

```typescript
// Add console logging
console.log('Current URL:', page.url());
console.log('Element count:', await element.count());

// Take screenshot manually
await page.screenshot({ path: 'debug.png', fullPage: true });

// Pause execution (interactive debug)
await page.pause();

// Run in headed mode
// npm run e2e:headed

// Run in UI mode
// npm run e2e:ui
```

## Performance Tips

1. Use parallel execution (default)
2. Track all entities for cleanup
3. Use specific selectors
4. Avoid arbitrary timeouts
5. Retry only flaky assertions

## File Structure

```
frontend/e2e/
├── stable-test-fixture.ts      # Main fixture with all helpers
├── test-helpers.ts             # TestHelpers class
├── test-user-manager.ts        # TestUserManager class
├── test-data-cleanup.ts        # TestDataCleanup class
├── auth.fixture.ts             # Legacy auth (backward compatible)
├── helpers.ts                  # Legacy helpers (backward compatible)
├── STABILIZATION_GUIDE.md      # Comprehensive guide
├── MIGRATION_EXAMPLE.md        # Detailed migration example
├── QUICK_REFERENCE.md          # This file
└── *.spec.ts                   # Test files
```

## Migration Checklist

- [ ] Import `stable-test-fixture`
- [ ] Add `helpers`, `dataCleanup` to test params
- [ ] Add `beforeEach` with initialization
- [ ] Add `afterEach` with cleanup
- [ ] Replace `waitForTimeout` with proper waits
- [ ] Track all created entities
- [ ] Wrap flaky assertions in `retryAssertion`
- [ ] Use `waitForApiResponse` for API calls
- [ ] Test 10 times locally
- [ ] Verify in CI

## Common Issues

### Test hangs
- Check for missing `await` keywords
- Verify selector is correct
- Increase timeout values

### Element not found
- Add retry logic
- Check selector specificity
- Wait for proper state (visible vs attached)

### Cleanup fails
- Verify entities exist before cleanup
- Check auth headers
- Ensure correct entity IDs

### Flaky assertions
- Add retry with exponential backoff
- Increase maxAttempts
- Check for race conditions
