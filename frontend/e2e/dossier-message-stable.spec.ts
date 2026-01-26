import { test, expect } from './stable-test-fixture';
import {
  waitForApiCall,
  validateDossierResponse,
  validateMessageResponse,
  validatePageResponse,
  validateRequestHeaders,
} from './api-validation';

test.describe('Dossier Message E2E Tests (Stabilized)', () => {
  test.beforeEach(async ({ authenticatedPage: page, helpers }) => {
    await helpers.retryAssertion(async () => {
      await page.goto('/');
      await page.waitForSelector('app-root', { timeout: 10000 });
    });
  });

  test('Create dossier and add message with stable waits', async ({ 
    authenticatedPage: page, 
    helpers, 
    cleanup 
  }) => {
    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const leadName = `Test Lead ${timestamp}`;
    const leadPhone = `+336${String(timestamp).slice(-8)}`;

    const createButton = await helpers.waitForSelector(
      'button:has-text("Créer"), button:has-text("Nouveau")'
    );
    await createButton.first().click();

    await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
    await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

    const createDossierPromise = helpers.waitForApiResponse(/\/api\/v1\/dossiers$/, {
      expectedStatus: 201,
    });

    const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
    await submitButton.click();

    const { body: dossierBody } = await createDossierPromise;
    expect(dossierBody.id).toBeTruthy();
    cleanup.trackDossier(dossierBody.id);

    await helpers.retryAssertion(async () => {
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
    });

    const dossierId = helpers.extractDossierId(page.url());
    expect(dossierId).toBeTruthy();

    await helpers.switchToTab('Messages');

    await helpers.retryAssertion(async () => {
      const messagesTab = page.locator('.mat-mdc-tab-body-active, [role="tabpanel"][aria-hidden="false"]');
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
    cleanup.trackMessage(messageBody.id);

    await helpers.closeSnackbar();

    await helpers.retryAssertion(async () => {
      const messageCard = page.locator('.message-card, .timeline-item').filter({ 
        hasText: messageContent 
      });
      await expect(messageCard.first()).toBeVisible({ timeout: 10000 });
    });

    const messageCard = page.locator('.message-card, .timeline-item').filter({ 
      hasText: messageContent 
    });
    await expect(messageCard.locator('.channel-badge').filter({ hasText: 'EMAIL' })).toBeVisible();
    await expect(messageCard.locator('.direction-badge').filter({ hasText: /Entrant|INBOUND/i })).toBeVisible();
  });

  test('Handle message creation error with retry', async ({ authenticatedPage: page, helpers, cleanup }) => {
    await helpers.navigateToDossiers();

    await helpers.ensureDossierExists('Test Lead Error', '+33612345999');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    const dossierId = helpers.extractDossierId(page.url());
    if (dossierId) {
      cleanup.trackDossier(dossierId);
    }

    await helpers.switchToTab('Messages');

    const addMessageButton = await helpers.waitForSelector('button:has-text("Nouveau message")');
    await addMessageButton.click();

    await helpers.waitForDialog();

    await page.route(/\/api\/v1\/messages$/, async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();
        
        if (!postData.content || postData.content.trim() === '') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            headers: {
              'X-Org-Id': 'ORG-001',
              'X-Correlation-Id': 'test-400',
            },
            body: JSON.stringify({
              type: 'about:blank',
              title: 'Bad Request',
              status: 400,
              detail: 'Le contenu du message ne peut pas être vide',
              instance: '/api/v1/messages',
            }),
          });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('input[type="datetime-local"]').first().fill(
      helpers.formatDateTimeLocal(new Date())
    );

    const errorResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/messages') && resp.status() === 400
    );

    const submitButton = page.locator(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );
    await submitButton.first().click();

    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(400);

    const errorBody = await errorResponse.json();
    expect(errorBody.status).toBe(400);
    expect(errorBody.detail).toContain('vide');

    await helpers.retryAssertion(async () => {
      const snackbar = page.locator('.mat-mdc-snack-bar-container, .snackbar');
      await expect(snackbar).toBeVisible({ timeout: 5000 });
    });
  });

  test('Message list loads with proper pagination', async ({ authenticatedPage: page, helpers, cleanup }) => {
    await helpers.navigateToDossiers();

    await helpers.ensureDossierExists('Test Pagination', '+33612346000');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    const dossierId = helpers.extractDossierId(page.url());
    if (dossierId) {
      cleanup.trackDossier(dossierId);
    }

    await helpers.switchToTab('Messages');

    const messagesListPromise = helpers.waitForApiResponse(
      /\/api\/v1\/messages\?.*dossierId=\d+/,
      { expectedStatus: 200 }
    );

    await messagesListPromise;

    await helpers.retryAssertion(async () => {
      const messagesContainer = page.locator(
        '.messages-container, .timeline-container, [data-testid="messages-list"]'
      );
      await expect(messagesContainer).toBeVisible({ timeout: 10000 });
    });

    const emptyState = page.locator('.empty-message, .empty-state');
    const hasMessages = await page.locator('.message-card, .timeline-item').count() > 0;

    if (!hasMessages) {
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    }
  });
});
