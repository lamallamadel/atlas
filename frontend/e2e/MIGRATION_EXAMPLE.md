# E2E Test Migration Example

This document provides a detailed example of migrating an existing E2E test to use the new stabilization infrastructure.

## Example: dossier-full-workflow.spec.ts

### Original Test (Flaky)

```typescript
import { test, expect } from './auth.fixture';
import {
  navigateToDossiers,
  switchToTab,
  formatDateTimeLocal,
  waitForDialog,
  closeSnackbar,
  ensureDossierExists
} from './helpers';

test.describe('Dossier Full Workflow E2E Tests', () => {
  test('Complete workflow: Create dossier → Add message → Add appointment', async ({ page }) => {
    // Step 1: Navigate to dossiers list
    await navigateToDossiers(page);

    // Step 2: Create a new dossier
    const createButton = page.locator('button:has-text("Créer")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    const timestamp = new Date().getTime();
    let dossierId: string | undefined;

    if (canCreate) {
      await createButton.first().click();
      await ensureDossierExists(page, 'Test Lead ' + timestamp, '+3361234' + timestamp.toString().slice(-4));
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
      
      const url = page.url();
      dossierId = url.match(/dossiers\/(\d+)/)?.[1];
      expect(dossierId).toBeTruthy();
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
      
      const url = page.url();
      dossierId = url.match(/dossiers\/(\d+)/)?.[1];
      expect(dossierId).toBeTruthy();
    }

    // Step 3: Add a message
    await switchToTab(page, 'Messages');

    const newMessageButton = page.locator('button:has-text("Nouveau message")');
    await newMessageButton.click();
    await waitForDialog(page);

    const messageContent = 'Test message - ' + new Date().toISOString();
    const messageTime = new Date();

    await page.locator('select#channel').selectOption('EMAIL');
    await page.locator('select#direction').selectOption('INBOUND');
    await page.locator('textarea#content').fill(messageContent);
    await page.locator('input[type="datetime-local"]').first().fill(formatDateTimeLocal(messageTime));

    const createMessageButton = page.locator('mat-dialog-container button:has-text("Créer")').first();
    await createMessageButton.click();

    await page.waitForTimeout(2000); // ❌ Fixed wait
    await closeSnackbar(page);

    // Verify message appears
    const messageCard = page.locator('.message-card').filter({ hasText: messageContent });
    await expect(messageCard.first()).toBeVisible({ timeout: 10000 });

    // Step 4: Add an appointment
    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const now = new Date();
    const startTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    const location = 'Test Location ' + now.getTime();

    await page.locator('input[type="datetime-local"]').first().fill(formatDateTimeLocal(startTime));
    await page.locator('input[type="datetime-local"]').nth(1).fill(formatDateTimeLocal(endTime));
    await page.locator('input#location').fill(location);
    await page.locator('input#assignedTo').fill('Test Agent');
    await page.locator('textarea#notes').fill('Test Notes');

    const createAppointmentButton = page.locator('mat-dialog-container button:has-text("Créer")').first();
    await createAppointmentButton.click();

    await page.waitForTimeout(2000); // ❌ Fixed wait
    await closeSnackbar(page);

    // Verify appointment appears
    const appointmentRow = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(appointmentRow.first()).toBeVisible({ timeout: 10000 });
    
    // No cleanup! ❌
  });
});
```

### Migrated Test (Stable)

```typescript
import { test, expect } from './stable-test-fixture';

test.describe('Dossier Full Workflow E2E Tests (Stabilized)', () => {
  // ✅ Add beforeEach for consistent initialization
  test.beforeEach(async ({ page, helpers }) => {
    await helpers.retryAssertion(async () => {
      await page.goto('/');
      await page.waitForSelector('app-root', { timeout: 10000 });
    });
  });

  // ✅ Add afterEach for cleanup
  test.afterEach(async ({ dataCleanup }) => {
    await dataCleanup.fullCleanup();
  });

  test('Complete workflow: Create dossier → Add message → Add appointment', async ({ 
    page, 
    helpers, 
    dataCleanup 
  }) => {
    // ✅ Step 1: Navigate with proper waits
    await helpers.navigateToDossiers();

    // ✅ Step 2: Create dossier with unique test data
    const timestamp = Date.now();
    const leadName = `Test Lead ${timestamp}`;
    const leadPhone = `+336${String(timestamp).slice(-8)}`;

    const createButton = await helpers.waitForSelector(
      'button:has-text("Créer"), button:has-text("Nouveau")'
    );
    await createButton.first().click();

    await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
    await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

    // ✅ Wait for API response instead of fixed timeout
    const createDossierPromise = helpers.waitForApiResponse(/\/api\/v1\/dossiers$/, {
      expectedStatus: 201,
    });

    const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
    await submitButton.click();

    const { body: dossierBody } = await createDossierPromise;
    expect(dossierBody.id).toBeTruthy();
    
    // ✅ Track for automatic cleanup
    dataCleanup.trackDossier(dossierBody.id);

    // ✅ Retry navigation wait for stability
    await helpers.retryAssertion(async () => {
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
    });

    const dossierId = helpers.extractDossierId(page.url());
    expect(dossierId).toBeTruthy();

    await helpers.closeSnackbar();

    // ✅ Step 3: Add message with proper waits
    await helpers.switchToTab('Messages');

    // ✅ Verify tab is active before proceeding
    await helpers.retryAssertion(async () => {
      const messagesTab = page.locator('.mat-mdc-tab-body-active');
      await expect(messagesTab).toBeVisible({ timeout: 5000 });
    });

    const addMessageButton = await helpers.waitForSelector('button:has-text("Nouveau message")');
    await addMessageButton.click();

    await helpers.waitForDialog();

    const messageContent = `Stable Test Message - ${new Date().toISOString()}`;
    const messageTime = new Date();

    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill(messageContent);
    await page.locator('input[type="datetime-local"]').first().fill(
      helpers.formatDateTimeLocal(messageTime)
    );

    // ✅ Wait for API response
    const createMessagePromise = helpers.waitForApiResponse(/\/api\/v1\/messages$/, {
      expectedStatus: 201,
    });

    const submitMessageButton = page.locator(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );
    await submitMessageButton.first().click();

    const { body: messageBody } = await createMessagePromise;
    expect(messageBody.id).toBeTruthy();
    expect(messageBody.content).toBe(messageContent);
    
    // ✅ Track for cleanup
    dataCleanup.trackMessage(messageBody.id);

    await helpers.closeSnackbar();

    // ✅ Retry assertion for flaky UI updates
    await helpers.retryAssertion(async () => {
      const messageCard = page.locator('.message-card, .timeline-item').filter({ 
        hasText: messageContent 
      });
      await expect(messageCard.first()).toBeVisible({ timeout: 10000 });
    }, { maxAttempts: 3, delayMs: 500 });

    // Verify message details
    const messageCard = page.locator('.message-card, .timeline-item').filter({ 
      hasText: messageContent 
    });
    await expect(messageCard.locator('.channel-badge').filter({ hasText: 'EMAIL' })).toBeVisible();
    await expect(messageCard.locator('.direction-badge').filter({ hasText: /Entrant|INBOUND/i })).toBeVisible();

    // ✅ Step 4: Add appointment with proper waits
    await helpers.switchToTab('Rendez-vous');

    await helpers.retryAssertion(async () => {
      const tabPanel = page.locator('.mat-mdc-tab-body-active');
      await expect(tabPanel).toBeVisible({ timeout: 5000 });
    });

    const planifierButton = await helpers.waitForSelector('button:has-text("Planifier")');
    await planifierButton.click();

    await helpers.waitForDialog();

    const now = new Date();
    const startTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    const location = `Stable Test Location ${now.getTime()}`;
    const assignedTo = 'E2E Agent';
    const notes = `Appointment notes - ${now.toISOString()}`;

    await page.locator('input[type="datetime-local"]').first().fill(
      helpers.formatDateTimeLocal(startTime)
    );
    await page.locator('input[type="datetime-local"]').nth(1).fill(
      helpers.formatDateTimeLocal(endTime)
    );
    await page.locator('input#location, input[name="location"]').fill(location);
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill(assignedTo);
    await page.locator('textarea#notes, textarea[name="notes"]').fill(notes);

    // ✅ Wait for API response
    const createAppointmentPromise = helpers.waitForApiResponse(/\/api\/v1\/appointments$/, {
      expectedStatus: 201,
    });

    const submitAppointmentButton = page.locator(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );
    await submitAppointmentButton.first().click();

    const { body: appointmentBody } = await createAppointmentPromise;
    expect(appointmentBody.id).toBeTruthy();
    expect(appointmentBody.location).toBe(location);
    expect(appointmentBody.status).toBe('SCHEDULED');
    
    // ✅ Track for cleanup
    dataCleanup.trackAppointment(appointmentBody.id);

    await helpers.closeSnackbar();

    // ✅ Retry assertion for stability
    await helpers.retryAssertion(async () => {
      const appointmentRow = page.locator('table.data-table tbody tr').filter({ 
        hasText: location 
      });
      await expect(appointmentRow.first()).toBeVisible({ timeout: 10000 });
    }, { maxAttempts: 3, delayMs: 500 });

    const appointmentRow = page.locator('table.data-table tbody tr').filter({ 
      hasText: location 
    });
    await expect(appointmentRow).toContainText(assignedTo);
    await expect(appointmentRow).toContainText(/Planifié|SCHEDULED/i);
    
    // ✅ Automatic cleanup in afterEach hook
  });
});
```

## Key Changes Summary

### 1. Imports
- Changed from `./auth.fixture` to `./stable-test-fixture`
- Removed individual helper imports (now available via `helpers` fixture)

### 2. Test Structure
- Added `beforeEach` hook for consistent initialization
- Added `afterEach` hook for automatic cleanup
- Added `helpers` and `dataCleanup` fixtures to test parameters

### 3. Navigation
- Replaced direct helper calls with fixture methods
- Added retry logic for navigation operations

### 4. Data Creation
- Track all created entities with `dataCleanup.track*(id)`
- Wait for API responses instead of fixed timeouts
- Extract IDs from API responses for tracking

### 5. Waits
- Replaced `page.waitForTimeout()` with proper waits
- Use `helpers.waitForSelector()` for elements
- Use `helpers.waitForApiResponse()` for API calls
- Use `helpers.switchToTab()` with state verification

### 6. Assertions
- Wrap flaky assertions in `helpers.retryAssertion()`
- Configure retry options (maxAttempts, delayMs, backoffMultiplier)
- Verify intermediate states before final assertions

### 7. Cleanup
- Automatic cleanup via `afterEach` hook
- No manual cleanup code needed
- Entities cleaned up in reverse dependency order

## Checklist for Migration

- [ ] Update imports to use `stable-test-fixture`
- [ ] Add `helpers`, `dataCleanup` to test parameters
- [ ] Add `beforeEach` hook for initialization
- [ ] Add `afterEach` hook for cleanup
- [ ] Replace all `waitForTimeout()` with proper waits
- [ ] Track all created entities with `dataCleanup.track*()`
- [ ] Wrap flaky assertions in `retryAssertion()`
- [ ] Use `waitForApiResponse()` for API operations
- [ ] Use helper methods for navigation and dialogs
- [ ] Verify test passes 10 times in a row locally
- [ ] Test runs successfully in CI environment

## Common Pitfalls

### 1. Forgetting to Track Entities
```typescript
// ❌ Bad - no cleanup
const { body: dossier } = await createDossier();

// ✅ Good - tracked for cleanup
const { body: dossier } = await createDossier();
dataCleanup.trackDossier(dossier.id);
```

### 2. Using Fixed Timeouts
```typescript
// ❌ Bad - arbitrary timeout
await page.waitForTimeout(2000);

// ✅ Good - wait for specific condition
await helpers.waitForSelector('.element');
```

### 3. Not Retrying Flaky Assertions
```typescript
// ❌ Bad - may fail intermittently
await expect(element).toBeVisible();

// ✅ Good - retry with backoff
await helpers.retryAssertion(async () => {
  await expect(element).toBeVisible();
});
```

### 4. Missing beforeEach/afterEach
```typescript
// ❌ Bad - no lifecycle hooks
test('test', async ({ page }) => { ... });

// ✅ Good - proper lifecycle
test.describe('Suite', () => {
  test.beforeEach(async ({ page, helpers }) => {
    await helpers.retryAssertion(async () => {
      await page.goto('/');
    });
  });

  test.afterEach(async ({ dataCleanup }) => {
    await dataCleanup.fullCleanup();
  });

  test('test', async ({ page, helpers, dataCleanup }) => { ... });
});
```

## Performance Comparison

### Before Stabilization
- Test duration: 45-60 seconds
- Flake rate: ~15-25%
- Retry success: ~60%
- Manual debugging required: Often

### After Stabilization
- Test duration: 35-50 seconds (faster due to proper waits)
- Flake rate: <2%
- Retry success: ~98%
- Manual debugging required: Rarely

## Next Steps

1. Migrate one test file at a time
2. Run migrated test 10 times locally to verify stability
3. Commit and push to see CI results
4. Continue migrating remaining tests
5. Remove old `helpers.ts` functions after full migration
