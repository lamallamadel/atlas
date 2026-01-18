import { test, expect } from './auth.fixture';
import { ensureDossierExists, switchToTab, formatDateTimeLocal, extractDossierId, waitForDialog } from './helpers';
import {
  waitForApiCall,
  validateAppointmentResponse,
  validatePageResponse,
  validateErrorSnackbar,
  validateProblemDetails,
  validateRequestHeaders,
  validateResponseHeaders,
  mockErrorResponse
} from './api-validation';

test.describe('DatetimePicker - Appointment Creation E2E Tests', () => {
  test('should create appointment with valid date/time using DatetimePicker', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test DatetimePicker Appointment', '+33612340001');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    const dossierId = extractDossierId(page.url());
    expect(dossierId).toBeTruthy();

    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const location = `Test Location DatetimePicker - ${now.getTime()}`;

    const startDatetimePicker = page.locator('app-datetime-picker').first();
    await startDatetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await startDatetimePicker.locator('input[type="time"]').fill(
      `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`
    );

    const endDatetimePicker = page.locator('app-datetime-picker').nth(1);
    await endDatetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await endDatetimePicker.locator('input[type="time"]').fill(
      `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`
    );

    await page.locator('input#location, input[name="location"]').fill(location);
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill('Agent DatetimePicker');
    await page.locator('textarea#notes, textarea[name="notes"]').fill('Created with DatetimePicker');

    const createAppointmentPromise = waitForApiCall(page, /\/api\/v1\/appointments$/, {
      expectedStatus: 201,
      validateResponse: (body) => {
        validateAppointmentResponse(body);
        expect(body.location).toBe(location);
        expect(body.assignedTo).toBe('Agent DatetimePicker');
        expect(body.notes).toBe('Created with DatetimePicker');
        expect(body.dossierId.toString()).toBe(dossierId);
        expect(body.status).toBe('SCHEDULED');
      }
    });

    const submitButton = page.locator('mat-dialog-container button:has-text("Planifier")');
    await submitButton.click();

    const { request: createRequest, response: createResponse } = await createAppointmentPromise;
    expect(createResponse.id).toBeTruthy();
    validateRequestHeaders(createRequest);

    await page.waitForTimeout(2000);

    const appointmentRow = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(appointmentRow).toBeVisible({ timeout: 10000 });
    await expect(appointmentRow).toContainText('Agent DatetimePicker');
    await expect(appointmentRow).toContainText('Planifié');
  });

  test('should show validation error when date is missing', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Validation Error', '+33612340002');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const startDatetimePicker = page.locator('app-datetime-picker').first();
    await startDatetimePicker.locator('input[type="time"]').fill('14:30');
    await startDatetimePicker.locator('input[type="time"]').blur();

    const errorMessage = startDatetimePicker.locator('.datetime-error:has-text("requis")');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    const submitButton = page.locator('mat-dialog-container button:has-text("Planifier")');
    await expect(submitButton).toBeDisabled();
  });

  test('should show validation error when time is invalid', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Invalid Time', '+33612340003');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const startDatetimePicker = page.locator('app-datetime-picker').first();
    await startDatetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    
    await startDatetimePicker.locator('input[type="time"]').fill('25:99');
    await startDatetimePicker.locator('input[type="time"]').blur();

    await page.waitForTimeout(500);

    const submitButton = page.locator('mat-dialog-container button:has-text("Planifier")');
    await expect(submitButton).toBeDisabled();
  });

  test('should show validation error when time is missing', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Missing Time', '+33612340004');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const startDatetimePicker = page.locator('app-datetime-picker').first();
    await startDatetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await startDatetimePicker.locator('input[type="time"]').blur();

    const errorMessage = startDatetimePicker.locator('.datetime-error:has-text("requis")');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    const submitButton = page.locator('mat-dialog-container button:has-text("Planifier")');
    await expect(submitButton).toBeDisabled();
  });

  test('should handle 400 Bad Request for invalid appointment time range', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test 400 Error', '+33612340005');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() - 60 * 60 * 1000);

    const startDatetimePicker = page.locator('app-datetime-picker').first();
    await startDatetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await startDatetimePicker.locator('input[type="time"]').fill(
      `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`
    );

    const endDatetimePicker = page.locator('app-datetime-picker').nth(1);
    await endDatetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await endDatetimePicker.locator('input[type="time"]').fill(
      `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`
    );

    await page.locator('input#location, input[name="location"]').fill('Invalid Location');
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill('Agent');
    await page.locator('textarea#notes, textarea[name="notes"]').fill('Invalid appointment');

    await page.route(/\/api\/v1\/appointments$/, async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        
        if (new Date(postData.endTime) < new Date(postData.startTime)) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            headers: {
              'X-Org-Id': 'ORG-001',
              'X-Correlation-Id': 'test-correlation-id-400'
            },
            body: JSON.stringify({
              type: 'about:blank',
              title: 'Bad Request',
              status: 400,
              detail: "L'heure de fin doit être après l'heure de début",
              instance: '/api/v1/appointments'
            })
          });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    const errorResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/appointments') && response.status() === 400
    );

    const submitButton = page.locator('mat-dialog-container button:has-text("Planifier")');
    await submitButton.click();

    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(400);
    
    const errorResponseHeaders = errorResponse.headers();
    expect(errorResponseHeaders['x-org-id']).toBeTruthy();
    expect(errorResponseHeaders['x-correlation-id']).toBeTruthy();

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 400);
    expect(errorBody.detail).toContain('fin');

    await validateErrorSnackbar(page, /fin.*début|invalide|erreur/i);
  });

  test('should display DatetimePicker with correct labels', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test DatetimePicker Labels', '+33612340006');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const startDatetimePicker = page.locator('app-datetime-picker').first();
    await expect(startDatetimePicker.locator('.datetime-label')).toContainText('Date et heure de début');
    await expect(startDatetimePicker.locator('.datetime-label .required')).toBeVisible();

    const endDatetimePicker = page.locator('app-datetime-picker').nth(1);
    await expect(endDatetimePicker.locator('.datetime-label')).toContainText('Date et heure de fin');
    await expect(endDatetimePicker.locator('.datetime-label .required')).toBeVisible();

    await expect(startDatetimePicker.locator('mat-form-field').first()).toContainText('Date');
    await expect(startDatetimePicker.locator('mat-form-field').nth(1)).toContainText('Heure');
  });

  test('should allow editing appointment with DatetimePicker', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Edit Appointment', '+33612340007');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const location = `Test Edit Location - ${now.getTime()}`;

    const startDatetimePicker = page.locator('app-datetime-picker').first();
    await startDatetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await startDatetimePicker.locator('input[type="time"]').fill(
      `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`
    );

    const endDatetimePicker = page.locator('app-datetime-picker').nth(1);
    await endDatetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await endDatetimePicker.locator('input[type="time"]').fill(
      `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`
    );

    await page.locator('input#location, input[name="location"]').fill(location);
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill('Original Agent');

    const createAppointmentPromise = waitForApiCall(page, /\/api\/v1\/appointments$/, {
      expectedStatus: 201,
      validateResponse: (body) => {
        validateAppointmentResponse(body);
      }
    });

    const submitButton = page.locator('mat-dialog-container button:has-text("Planifier")');
    await submitButton.click();

    const { response: createResponse } = await createAppointmentPromise;
    const appointmentId = createResponse.id;

    await page.waitForTimeout(2000);

    const appointmentRow = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(appointmentRow).toBeVisible({ timeout: 10000 });

    const editButton = appointmentRow.locator('button[aria-label*="Modifier"], button:has-text("Modifier")');
    if (await editButton.count() > 0) {
      await editButton.click();
      await waitForDialog(page);

      await expect(page.locator('mat-dialog-container')).toContainText('Modifier');

      await page.locator('input#assignedTo, input[name="assignedTo"]').fill('Updated Agent');

      const updateAppointmentPromise = waitForApiCall(page, new RegExp(`/api/v1/appointments/${appointmentId}$`), {
        expectedStatus: 200,
        validateResponse: (body) => {
          validateAppointmentResponse(body);
          expect(body.assignedTo).toBe('Updated Agent');
        }
      });

      const updateButton = page.locator('mat-dialog-container button:has-text("Modifier")');
      await updateButton.click();

      await updateAppointmentPromise;
      await page.waitForTimeout(2000);

      await expect(appointmentRow).toContainText('Updated Agent');
    }
  });

  test('should handle form cancellation without submitting', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Cancel Form', '+33612340008');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const startDatetimePicker = page.locator('app-datetime-picker').first();
    await startDatetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await startDatetimePicker.locator('input[type="time"]').fill('14:30');

    const cancelButton = page.locator('mat-dialog-container button:has-text("Annuler")');
    await cancelButton.click();

    await expect(page.locator('mat-dialog-container')).not.toBeVisible({ timeout: 5000 });

    const appointmentRows = page.locator('table.data-table tbody tr');
    const noDataMessage = page.locator('.empty-message, .no-data');
    
    const hasRows = await appointmentRows.count() > 0;
    const hasNoDataMessage = await noDataMessage.isVisible().catch(() => false);
    
    expect(hasRows || hasNoDataMessage).toBeTruthy();
  });
});
