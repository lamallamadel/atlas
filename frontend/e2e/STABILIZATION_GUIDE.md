# E2E Test Stabilization Guide

## Overview

This guide describes the stabilization improvements made to the Playwright E2E test suite to eliminate flakiness and improve reliability.

## Key Improvements

### 1. Deterministic Test User Creation

**Before:**
- Tests used shared authentication state from `storageState.json`
- Tests could interfere with each other due to shared org context
- User state was not cleaned up between tests

**After:**
- Each test spec creates a unique test user with a unique org ID
- Test users are created in `beforeEach` hooks
- All user data is cleaned up in `afterEach` hooks
- Complete test isolation

**Usage:**
```typescript
import { test, expect } from './stable-test-fixture';

test('My test', async ({ page, userManager, helpers }) => {
  // Test user is automatically created with unique org ID
  // Access via userManager if needed
  const currentUser = await userManager.getCurrentUser();
  console.log(`Testing with user: ${currentUser?.username}`);
});
```

### 2. Replace Fixed wait() with Intelligent Waits

**Before:**
```typescript
await page.waitForTimeout(1000); // ❌ Flaky - arbitrary timeout
await tab.click();
```

**After:**
```typescript
// ✅ Wait for specific selector to be visible
await helpers.waitForSelector('.my-element', { timeout: 10000 });

// ✅ Wait for API response
const { body } = await helpers.waitForApiResponse(/\/api\/v1\/dossiers/, {
  expectedStatus: 200
});

// ✅ Wait for tab to be active
await helpers.switchToTab('Messages'); // Includes state verification
```

### 3. Retry Logic with Exponential Backoff

**Usage:**
```typescript
import { test, expect } from './stable-test-fixture';

test('Flaky assertion example', async ({ page, helpers }) => {
  // Retry assertions with exponential backoff
  await helpers.retryAssertion(async () => {
    const element = page.locator('.dynamic-element');
    await expect(element).toBeVisible({ timeout: 5000 });
  }, {
    maxAttempts: 3,
    delayMs: 500,
    backoffMultiplier: 2,
    timeout: 30000
  });
});
```

**Default retry options:**
- `maxAttempts`: 3
- `delayMs`: 500ms
- `backoffMultiplier`: 2 (500ms → 1000ms → 2000ms)
- `timeout`: 30000ms

### 4. Test Data Cleanup

**Before:**
- Test data remained in database after test completion
- Tests could fail due to existing data from previous runs
- Manual cleanup required

**After:**
```typescript
test('Create and cleanup', async ({ page, dataCleanup, helpers }) => {
  // Create dossier
  const { body: dossier } = await helpers.waitForApiResponse(/\/api\/v1\/dossiers$/, {
    expectedStatus: 201
  });
  
  // Track for cleanup
  dataCleanup.trackDossier(dossier.id);
  
  // Create message
  const { body: message } = await helpers.waitForApiResponse(/\/api\/v1\/messages$/, {
    expectedStatus: 201
  });
  
  // Track for cleanup
  dataCleanup.trackMessage(message.id);
  
  // Automatic cleanup in afterEach
});
```

**Cleanup is automatic:**
- `afterEach` hook calls `dataCleanup.fullCleanup()`
- Cleans up tracked entities in reverse order (dependencies first)
- Clears test-related localStorage entries

### 5. Screenshot Capture on Failure

**Automatic screenshot capture:**
- Full-page screenshots saved to `test-results/screenshots/`
- Filename includes test name and timestamp
- Error context logged (URL, title, error message)

**Manual screenshot:**
```typescript
try {
  await someFlakyOperation();
} catch (error) {
  await helpers.takeScreenshotOnFailure('operation-name', error);
  throw error;
}
```

**Configuration in `playwright.config.ts`:**
```typescript
use: {
  screenshot: {
    mode: 'only-on-failure',
    fullPage: true,
  },
  video: {
    mode: 'retain-on-failure',
    size: { width: 1280, height: 720 }
  },
}
```

## Core Components

### TestHelpers Class

**Location:** `frontend/e2e/test-helpers.ts`

**Methods:**
- `retryAssertion<T>(fn, options)` - Retry assertions with exponential backoff
- `waitForSelector(selector, options)` - Wait for element with state verification
- `waitForResponse(urlPattern, options)` - Wait for network response
- `waitForApiResponse(urlPattern, options)` - Wait for API response and parse JSON
- `navigateToDossiers()` - Navigate to dossiers with proper waits
- `navigateToAnnonces()` - Navigate to annonces with proper waits
- `switchToTab(tabName)` - Switch tabs with state verification
- `waitForDialog()` - Wait for Material dialog
- `closeSnackbar()` - Close snackbar with timeout handling
- `formatDateTimeLocal(date)` - Format date for datetime-local input
- `extractDossierId(url)` - Extract dossier ID from URL
- `extractAnnonceId(url)` - Extract annonce ID from URL
- `ensureDossierExists(leadName, leadPhone)` - Create or open dossier
- `takeScreenshotOnFailure(testName, error)` - Capture failure screenshot
- `retryOperation<T>(operation, options)` - Retry any operation

### TestUserManager Class

**Location:** `frontend/e2e/test-user-manager.ts`

**Methods:**
- `createTestUser(options)` - Create unique test user with JWT
- `loginAsUser(user)` - Log in as specific user
- `setupTestUser(options)` - Create and log in as new user
- `logout()` - Clear authentication
- `cleanupAllUsers()` - Clean up all created users
- `switchToUser(user)` - Switch to different test user
- `getCurrentUser()` - Get currently logged-in user

### TestDataCleanup Class

**Location:** `frontend/e2e/test-data-cleanup.ts`

**Methods:**
- `trackDossier(id, orgId)` - Track dossier for cleanup
- `trackAnnonce(id, orgId)` - Track annonce for cleanup
- `trackMessage(id, orgId)` - Track message for cleanup
- `trackAppointment(id, orgId)` - Track appointment for cleanup
- `trackPartiePrenante(id, orgId)` - Track partie prenante for cleanup
- `trackConsentement(id, orgId)` - Track consentement for cleanup
- `cleanupAll()` - Clean up all tracked entities
- `cleanupByType(type)` - Clean up entities of specific type
- `cleanupLocalStorage()` - Clean up test localStorage entries
- `fullCleanup()` - Full cleanup (all entities + localStorage)

## Migration Guide

### Step 1: Update Test Imports

**Before:**
```typescript
import { test, expect } from './auth.fixture';
import { navigateToDossiers, switchToTab } from './helpers';
```

**After:**
```typescript
import { test, expect } from './stable-test-fixture';
// helpers available via fixture
```

### Step 2: Add Fixtures to Test Function

**Before:**
```typescript
test('My test', async ({ page }) => {
  // test code
});
```

**After:**
```typescript
test('My test', async ({ page, userManager, dataCleanup, helpers }) => {
  // test code with stabilized fixtures
});
```

### Step 3: Add Lifecycle Hooks

**Before:**
```typescript
test.describe('My tests', () => {
  test('test 1', async ({ page }) => {
    // ...
  });
});
```

**After:**
```typescript
test.describe('My tests', () => {
  test.beforeEach(async ({ page, helpers }) => {
    await helpers.retryAssertion(async () => {
      await page.goto('/');
      await page.waitForSelector('app-root', { timeout: 10000 });
    });
  });

  test.afterEach(async ({ dataCleanup }) => {
    await dataCleanup.fullCleanup();
  });

  test('test 1', async ({ page, helpers, dataCleanup }) => {
    // ...
  });
});
```

### Step 4: Replace Fixed Waits

**Before:**
```typescript
await element.click();
await page.waitForTimeout(1000); // ❌
```

**After:**
```typescript
await element.click();
await helpers.waitForSelector('.expected-result', { timeout: 10000 }); // ✅
```

### Step 5: Track Created Data

**Before:**
```typescript
// Create dossier
await submitButton.click();
await page.waitForURL(/.*dossiers\/\d+/);
```

**After:**
```typescript
const createPromise = helpers.waitForApiResponse(/\/api\/v1\/dossiers$/, {
  expectedStatus: 201
});

await submitButton.click();

const { body: dossier } = await createPromise;
dataCleanup.trackDossier(dossier.id); // ✅ Track for cleanup
```

### Step 6: Add Retry Logic to Flaky Assertions

**Before:**
```typescript
const element = page.locator('.dynamic-element');
await expect(element).toBeVisible(); // ❌ May fail on slow loads
```

**After:**
```typescript
await helpers.retryAssertion(async () => {
  const element = page.locator('.dynamic-element');
  await expect(element).toBeVisible({ timeout: 5000 });
}, { maxAttempts: 3, delayMs: 500 }); // ✅
```

## Example: Migrated Test

**Before:**
```typescript
import { test, expect } from './auth.fixture';

test('Create message', async ({ page }) => {
  await page.goto('/dossiers');
  await page.waitForTimeout(2000); // ❌
  
  const firstRow = page.locator('tr').first();
  await firstRow.click();
  
  const messagesTab = page.locator('text=Messages');
  await messagesTab.click();
  await page.waitForTimeout(1000); // ❌
  
  const addButton = page.locator('button:has-text("Nouveau")');
  await addButton.click();
  await page.waitForTimeout(500); // ❌
  
  await page.fill('textarea#content', 'Test message');
  await page.click('button:has-text("Créer")');
  await page.waitForTimeout(2000); // ❌
  
  const message = page.locator('text=Test message');
  await expect(message).toBeVisible();
  
  // No cleanup! ❌
});
```

**After:**
```typescript
import { test, expect } from './stable-test-fixture';

test.describe('Message Tests', () => {
  test.beforeEach(async ({ page, helpers }) => {
    await helpers.retryAssertion(async () => {
      await page.goto('/');
      await page.waitForSelector('app-root', { timeout: 10000 });
    });
  });

  test.afterEach(async ({ dataCleanup }) => {
    await dataCleanup.fullCleanup();
  });

  test('Create message', async ({ page, helpers, dataCleanup }) => {
    // ✅ Navigate with proper waits
    await helpers.navigateToDossiers();
    
    // ✅ Ensure dossier exists with retry
    await helpers.ensureDossierExists('Test Lead', '+33612345678');
    
    const dossierId = helpers.extractDossierId(page.url());
    if (dossierId) {
      dataCleanup.trackDossier(dossierId); // ✅ Track for cleanup
    }
    
    // ✅ Switch tab with state verification
    await helpers.switchToTab('Messages');
    
    // ✅ Wait for button to be ready
    const addButton = await helpers.waitForSelector('button:has-text("Nouveau")');
    await addButton.click();
    
    // ✅ Wait for dialog
    await helpers.waitForDialog();
    
    const messageContent = `Test ${Date.now()}`;
    await page.fill('textarea#content', messageContent);
    
    // ✅ Wait for API response
    const createPromise = helpers.waitForApiResponse(/\/api\/v1\/messages$/, {
      expectedStatus: 201
    });
    
    await page.click('button:has-text("Créer")');
    
    const { body: message } = await createPromise;
    dataCleanup.trackMessage(message.id); // ✅ Track for cleanup
    
    // ✅ Close snackbar properly
    await helpers.closeSnackbar();
    
    // ✅ Retry assertion with backoff
    await helpers.retryAssertion(async () => {
      const messageCard = page.locator('.message-card').filter({ 
        hasText: messageContent 
      });
      await expect(messageCard).toBeVisible({ timeout: 10000 });
    }, { maxAttempts: 3, delayMs: 500 });
    
    // ✅ Automatic cleanup in afterEach
  });
});
```

## Best Practices

### 1. Always Use Fixtures
```typescript
// ✅ Good
test('test', async ({ page, helpers, dataCleanup }) => { ... });

// ❌ Bad
test('test', async ({ page }) => { ... });
```

### 2. Track All Created Data
```typescript
// ✅ Good
const { body } = await createResource();
dataCleanup.trackDossier(body.id);

// ❌ Bad - no cleanup
await createResource();
```

### 3. Use Proper Waits
```typescript
// ✅ Good - wait for specific condition
await helpers.waitForSelector('.element');
await helpers.waitForApiResponse(/\/api\/v1\/resource/);

// ❌ Bad - arbitrary timeout
await page.waitForTimeout(1000);
```

### 4. Retry Flaky Operations
```typescript
// ✅ Good - retry with backoff
await helpers.retryAssertion(async () => {
  await expect(element).toBeVisible();
});

// ❌ Bad - single attempt
await expect(element).toBeVisible();
```

### 5. Add beforeEach/afterEach Hooks
```typescript
// ✅ Good
test.describe('Suite', () => {
  test.beforeEach(async ({ page, helpers }) => {
    await helpers.retryAssertion(async () => {
      await page.goto('/');
    });
  });

  test.afterEach(async ({ dataCleanup }) => {
    await dataCleanup.fullCleanup();
  });
});

// ❌ Bad - no cleanup
test.describe('Suite', () => {
  test('test', async ({ page }) => { ... });
});
```

## Configuration Updates

### playwright.config.ts Changes

1. **Increased timeouts:**
   - Global timeout: 60000ms
   - Expect timeout: 10000ms
   - Action timeout: 15000ms
   - Navigation timeout: 30000ms

2. **Enhanced screenshot/video capture:**
   - Full-page screenshots on failure
   - Video recording on failure (1280x720)
   - Organized output in `test-results/`

3. **Retry configuration:**
   - CI: 2 retries
   - Local: 1 retry

4. **Better reporting:**
   - HTML report
   - JUnit XML for CI
   - JSON results
   - List reporter for terminal output

## Troubleshooting

### Test Times Out
- Check if proper waits are used (not `waitForTimeout`)
- Increase `timeout` in retry options
- Verify API endpoints are correct
- Check if cleanup is blocking (rare)

### Test Fails Intermittently
- Add retry logic with `helpers.retryAssertion()`
- Increase `maxAttempts` and adjust `backoffMultiplier`
- Check for race conditions in assertions
- Verify element selectors are specific enough

### Cleanup Fails
- Check if entities exist before cleanup
- Verify authentication headers are correct
- Increase timeout for cleanup operations
- Check network logs for 404/403 errors

### User Creation Fails
- Verify JWT token generation is correct
- Check localStorage is being set properly
- Ensure unique org IDs per test
- Check for conflicts with existing auth state

## Performance Tips

1. **Parallel execution:** Tests run in parallel by default with isolated users
2. **Fast cleanup:** Cleanup runs in reverse dependency order
3. **Efficient waits:** Use specific selectors instead of arbitrary timeouts
4. **Retry strategy:** Exponential backoff prevents excessive retries

## Additional Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Isolation Guide](https://playwright.dev/docs/test-isolation)
- [Debugging Tests](https://playwright.dev/docs/debug)
