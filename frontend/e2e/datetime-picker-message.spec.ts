import { test, expect } from './auth.fixture';
import { ensureDossierExists, switchToTab, formatDateTimeLocal, extractDossierId, waitForDialog } from './helpers';
import {
  waitForApiCall,
  validateMessageResponse,
  validatePageResponse,
  validateErrorSnackbar,
  validateProblemDetails,
  validateRequestHeaders,
  validateResponseHeaders,
  mockErrorResponse
} from './api-validation';

test.describe('DatetimePicker - Message Creation E2E Tests', () => {
  test('should create message with valid date/time using DatetimePicker', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test DatetimePicker Message', '+33612350001');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    const dossierId = extractDossierId(page.url());
    expect(dossierId).toBeTruthy();

    await switchToTab(page, 'Messages');

    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await waitForDialog(page);

    const messageContent = `Test E2E Message DatetimePicker - ${new Date().toISOString()}`;
    const now = new Date();

    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill(messageContent);

    const datetimePicker = page.locator('app-datetime-picker');
    await datetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await datetimePicker.locator('input[type="time"]').fill(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    );

    const createMessagePromise = waitForApiCall(page, /\/api\/v1\/messages$/, {
      expectedStatus: 201,
      validateResponse: (body) => {
        validateMessageResponse(body);
        expect(body.channel).toBe('EMAIL');
        expect(body.direction).toBe('INBOUND');
        expect(body.content).toBe(messageContent);
        expect(body.dossierId.toString()).toBe(dossierId);
      }
    });

    const submitButton = page.locator('mat-dialog-container button:has-text("Créer")');
    await submitButton.click();

    const { request: createRequest, response: createResponse } = await createMessagePromise;
    expect(createResponse.id).toBeTruthy();
    validateRequestHeaders(createRequest);

    await page.waitForTimeout(2000);

    const messageCard = page.locator('.message-card, .timeline-item').filter({ hasText: messageContent });
    await expect(messageCard).toBeVisible({ timeout: 10000 });

    const channelBadge = messageCard.locator('.channel-badge, .badge:has-text("EMAIL")');
    await expect(channelBadge).toBeVisible();

    const directionBadge = messageCard.locator('.direction-badge, .badge:has-text("Entrant")');
    await expect(directionBadge).toBeVisible();

    const messageContentElement = messageCard.locator('.message-content, .content');
    await expect(messageContentElement).toContainText(messageContent);
  });

  test('should show validation error when timestamp date is missing', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Message Validation', '+33612350002');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Messages');

    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await waitForDialog(page);

    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill('Test message content');

    const datetimePicker = page.locator('app-datetime-picker');
    await datetimePicker.locator('input[type="time"]').fill('14:30');
    await datetimePicker.locator('input[type="time"]').blur();

    const errorMessage = datetimePicker.locator('.datetime-error:has-text("requis")');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    const submitButton = page.locator('mat-dialog-container button:has-text("Créer")');
    await expect(submitButton).toBeDisabled();
  });

  test('should show validation error when timestamp time is invalid', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Invalid Timestamp', '+33612350003');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Messages');

    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await waitForDialog(page);

    await page.locator('select#channel, select[name="channel"]').selectOption('SMS');
    await page.locator('select#direction, select[name="direction"]').selectOption('OUTBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill('Test message');

    const datetimePicker = page.locator('app-datetime-picker');
    await datetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    
    await datetimePicker.locator('input[type="time"]').fill('99:99');
    await datetimePicker.locator('input[type="time"]').blur();

    await page.waitForTimeout(500);

    const submitButton = page.locator('mat-dialog-container button:has-text("Créer")');
    await expect(submitButton).toBeDisabled();
  });

  test('should show validation error when timestamp time is missing', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Missing Timestamp', '+33612350004');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Messages');

    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await waitForDialog(page);

    await page.locator('select#channel, select[name="channel"]').selectOption('WHATSAPP');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill('Test WhatsApp message');

    const datetimePicker = page.locator('app-datetime-picker');
    await datetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await datetimePicker.locator('input[type="time"]').blur();

    const errorMessage = datetimePicker.locator('.datetime-error:has-text("requis")');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    const submitButton = page.locator('mat-dialog-container button:has-text("Créer")');
    await expect(submitButton).toBeDisabled();
  });

  test('should handle 400 Bad Request for empty message content', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test 400 Message Error', '+33612350005');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Messages');

    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await waitForDialog(page);

    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');

    const datetimePicker = page.locator('app-datetime-picker');
    await datetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await datetimePicker.locator('input[type="time"]').fill('14:30');

    await page.route(/\/api\/v1\/messages$/, async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        
        if (!postData.content || postData.content.trim() === '') {
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
              detail: 'Le contenu du message ne peut pas être vide',
              instance: '/api/v1/messages'
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
      response.url().includes('/api/v1/messages') && response.status() === 400
    );

    const submitButton = page.locator('mat-dialog-container button:has-text("Créer")');
    await submitButton.click();

    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(400);
    
    const errorResponseHeaders = errorResponse.headers();
    expect(errorResponseHeaders['x-org-id']).toBeTruthy();
    expect(errorResponseHeaders['x-correlation-id']).toBeTruthy();

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 400);
    expect(errorBody.detail).toContain('vide');

    await validateErrorSnackbar(page, /contenu.*vide|invalide|erreur/i);
  });

  test('should display DatetimePicker with correct label for message timestamp', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Message Labels', '+33612350006');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Messages');

    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await waitForDialog(page);

    const datetimePicker = page.locator('app-datetime-picker');
    await expect(datetimePicker.locator('.datetime-label')).toContainText('Date et heure');
    await expect(datetimePicker.locator('.datetime-label .required')).toBeVisible();

    await expect(datetimePicker.locator('mat-form-field').first()).toContainText('Date');
    await expect(datetimePicker.locator('mat-form-field').nth(1)).toContainText('Heure');
  });

  test('should create message with different channels using DatetimePicker', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Message Channels', '+33612350007');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    const dossierId = extractDossierId(page.url());

    await switchToTab(page, 'Messages');

    const channels = ['EMAIL', 'SMS', 'WHATSAPP'];
    
    for (const channel of channels) {
      const addMessageButton = page.locator('button:has-text("Nouveau message")');
      await addMessageButton.click();
      await waitForDialog(page);

      const messageContent = `Test ${channel} Message - ${new Date().toISOString()}`;
      const now = new Date();

      await page.locator('select#channel, select[name="channel"]').selectOption(channel);
      await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
      await page.locator('textarea#content, textarea[name="content"]').fill(messageContent);

      const datetimePicker = page.locator('app-datetime-picker');
      await datetimePicker.locator('input[matInput][matDatepicker]').click();
      await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
      await datetimePicker.locator('input[type="time"]').fill(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );

      const createMessagePromise = waitForApiCall(page, /\/api\/v1\/messages$/, {
        expectedStatus: 201,
        validateResponse: (body) => {
          validateMessageResponse(body);
          expect(body.channel).toBe(channel);
          expect(body.content).toBe(messageContent);
        }
      });

      const submitButton = page.locator('mat-dialog-container button:has-text("Créer")');
      await submitButton.click();

      await createMessagePromise;
      await page.waitForTimeout(2000);

      const messageCard = page.locator('.message-card, .timeline-item').filter({ hasText: messageContent });
      await expect(messageCard).toBeVisible({ timeout: 10000 });
    }
  });

  test('should create message with different directions using DatetimePicker', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Message Directions', '+33612350008');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Messages');

    const directions = ['INBOUND', 'OUTBOUND'];
    
    for (const direction of directions) {
      const addMessageButton = page.locator('button:has-text("Nouveau message")');
      await addMessageButton.click();
      await waitForDialog(page);

      const messageContent = `Test ${direction} Message - ${new Date().toISOString()}`;
      const now = new Date();

      await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
      await page.locator('select#direction, select[name="direction"]').selectOption(direction);
      await page.locator('textarea#content, textarea[name="content"]').fill(messageContent);

      const datetimePicker = page.locator('app-datetime-picker');
      await datetimePicker.locator('input[matInput][matDatepicker]').click();
      await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
      await datetimePicker.locator('input[type="time"]').fill(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );

      const createMessagePromise = waitForApiCall(page, /\/api\/v1\/messages$/, {
        expectedStatus: 201,
        validateResponse: (body) => {
          validateMessageResponse(body);
          expect(body.direction).toBe(direction);
          expect(body.content).toBe(messageContent);
        }
      });

      const submitButton = page.locator('mat-dialog-container button:has-text("Créer")');
      await submitButton.click();

      await createMessagePromise;
      await page.waitForTimeout(2000);

      const messageCard = page.locator('.message-card, .timeline-item').filter({ hasText: messageContent });
      await expect(messageCard).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle form cancellation without submitting message', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Cancel Message', '+33612350009');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Messages');

    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await waitForDialog(page);

    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill('This should be cancelled');

    const datetimePicker = page.locator('app-datetime-picker');
    await datetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await datetimePicker.locator('input[type="time"]').fill('14:30');

    const cancelButton = page.locator('mat-dialog-container button:has-text("Annuler")');
    await cancelButton.click();

    await expect(page.locator('mat-dialog-container')).not.toBeVisible({ timeout: 5000 });

    const messageCards = page.locator('.message-card, .timeline-item').filter({ hasText: 'This should be cancelled' });
    await expect(messageCards).not.toBeVisible();
  });

  test('should validate all form fields before enabling submit button', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test Full Validation', '+33612350010');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Messages');

    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await waitForDialog(page);

    const submitButton = page.locator('mat-dialog-container button:has-text("Créer")');
    await expect(submitButton).toBeDisabled();

    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await expect(submitButton).toBeDisabled();

    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await expect(submitButton).toBeDisabled();

    await page.locator('textarea#content, textarea[name="content"]').fill('Test content');
    await expect(submitButton).toBeDisabled();

    const datetimePicker = page.locator('app-datetime-picker');
    await datetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await expect(submitButton).toBeDisabled();

    await datetimePicker.locator('input[type="time"]').fill('14:30');
    await page.waitForTimeout(500);
    
    await expect(submitButton).toBeEnabled();
  });

  test('should handle 403 Forbidden error when creating message', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    await ensureDossierExists(page, 'Test 403 Error', '+33612350011');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    await switchToTab(page, 'Messages');

    await page.route(/\/api\/v1\/messages$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          headers: {
            'X-Org-Id': 'ORG-001',
            'X-Correlation-Id': 'test-correlation-id-403'
          },
          body: JSON.stringify({
            type: 'about:blank',
            title: 'Forbidden',
            status: 403,
            detail: "Vous n'avez pas les droits nécessaires pour créer un message",
            instance: '/api/v1/messages'
          })
        });
      } else {
        await route.continue();
      }
    });

    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await waitForDialog(page);

    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill('Test forbidden message');

    const datetimePicker = page.locator('app-datetime-picker');
    await datetimePicker.locator('input[matInput][matDatepicker]').click();
    await page.locator('.mat-calendar-body-cell[aria-pressed="false"]').first().click();
    await datetimePicker.locator('input[type="time"]').fill('14:30');

    const errorResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/messages') && response.status() === 403
    );

    const submitButton = page.locator('mat-dialog-container button:has-text("Créer")');
    await submitButton.click();

    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(403);
    
    const errorResponseHeaders = errorResponse.headers();
    expect(errorResponseHeaders['x-org-id']).toBeTruthy();
    expect(errorResponseHeaders['x-correlation-id']).toBeTruthy();

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 403);
    expect(errorBody.detail).toContain('droits');

    await validateErrorSnackbar(page, /accès refusé|droits|forbidden/i);
  });
});
