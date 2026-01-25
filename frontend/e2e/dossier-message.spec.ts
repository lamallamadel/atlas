import { test, expect } from './stable-test-fixture';
import {
  waitForApiCall,
  validateDossierResponse,
  validateMessageResponse,
  validatePageResponse,
  validateErrorSnackbar,
  validateProblemDetails,
  validateRequestHeaders,
  validateResponseHeaders,
} from './api-validation';

test.describe('Dossier Message E2E Tests', () => {
  test('Scenario 1: Login → Navigate to dossiers list → Open dossier detail → Add message in Messages tab → Verify message appears in timeline', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    const dossiersListPromise = helpers.waitForApiCall(/\/api\/v1\/dossiers\?/, {
      expectedStatus: 200,
    });

    await helpers.navigateToDossiers();

    await dossiersListPromise;

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `Test Lead Message E2E ${timestamp}`,
      `+336123456${timestamp.toString().slice(-2)}`
    );

    cleanup.trackDossier(dossierId);

    await expect(page).toHaveURL(/.*dossiers\/\d+/);

    const messagesListPromise = helpers.waitForApiResponse(/\/api\/v1\/messages\?.*dossierId=\d+/, {
      expectedStatus: 200,
    });

    await helpers.switchToTab('Messages');

    const { body: messagesList } = await messagesListPromise;
    expect(messagesList.content).toBeTruthy();

    await helpers.clickButton('button:has-text("Nouveau message")');
    await helpers.waitForDialog();

    const messageContent = `Test E2E Message - ${new Date().toISOString()}`;
    const messageTimestamp = new Date().toISOString();

    await helpers.selectOption('select#channel, select[name="channel"]', 'EMAIL');
    await helpers.selectOption('select#direction, select[name="direction"]', 'INBOUND');
    await helpers.fillFormField('textarea#content, textarea[name="content"]', messageContent);
    await page.locator('input[type="datetime-local"]').fill(messageTimestamp.substring(0, 16));

    const createMessagePromise = helpers.waitForApiResponse(/\/api\/v1\/messages$/, {
      expectedStatus: 201,
    });

    await helpers.clickButton(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );

    const { body: createdMessage } = await createMessagePromise;
    expect(createdMessage.id).toBeTruthy();
    expect(createdMessage.channel).toBe('EMAIL');
    expect(createdMessage.direction).toBe('INBOUND');
    expect(createdMessage.content).toBe(messageContent);
    expect(createdMessage.dossierId.toString()).toBe(dossierId);

    cleanup.trackMessage(createdMessage.id);

    await helpers.closeSnackbar();

    const messageCard = page
      .locator('.message-card, .timeline-item')
      .filter({ hasText: messageContent });
    await expect(messageCard).toBeVisible({ timeout: 10000 });

    const messageTimestampElement = messageCard.locator('.message-timestamp, .timestamp');
    await expect(messageTimestampElement).toBeVisible();

    const channelBadge = messageCard.locator('.channel-badge, .badge:has-text("EMAIL")');
    await expect(channelBadge).toBeVisible();

    const directionBadge = messageCard.locator('.direction-badge, .badge:has-text("Entrant")');
    await expect(directionBadge).toBeVisible();

    const messageContentElement = messageCard.locator('.message-content, .content');
    await expect(messageContentElement).toContainText(messageContent);
  });

  test('Scenario 2: Test error handling - 400 Bad Request with ProblemDetails', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `Test Lead Error Handling ${timestamp}`,
      `+336123456${timestamp.toString().slice(-2)}`
    );

    cleanup.trackDossier(dossierId);

    await helpers.switchToTab('Messages');

    await helpers.waitForApiResponse(/\/api\/v1\/messages\?.*dossierId=\d+/, {
      expectedStatus: 200,
    });

    await helpers.clickButton('button:has-text("Nouveau message")');
    await helpers.waitForDialog();

    await helpers.selectOption('select#channel, select[name="channel"]', 'EMAIL');
    await helpers.selectOption('select#direction, select[name="direction"]', 'INBOUND');
    await page.locator('input[type="datetime-local"]').fill(new Date().toISOString().substring(0, 16));

    await page.route(/\/api\/v1\/messages$/, async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        if (!postData.content || postData.content.trim() === '') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            headers: {
              'X-Org-Id': 'ORG-001',
              'X-Correlation-Id': 'test-correlation-id-400',
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

    const errorResponsePromise = helpers.waitForApiCall(/\/api\/v1\/messages/, {
      expectedStatus: 400,
    });

    await helpers.clickButton(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );

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

  test('Scenario 3: Test error handling - 404 Not Found', async ({ authenticatedPage: page, helpers }) => {
    await page.route(/\/api\/v1\/messages\/9999999$/, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        headers: {
          'X-Org-Id': 'ORG-001',
          'X-Correlation-Id': 'test-correlation-id-404',
        },
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Le message demandé est introuvable',
          instance: '/api/v1/messages/9999999',
        }),
      });
    });

    await helpers.navigateToDossiers();

    const errorResponsePromise = helpers.waitForApiCall(/\/api\/v1\/messages\/9999999/, {
      expectedStatus: 404,
    });

    await page.evaluate(() => {
      fetch('/api/v1/messages/9999999', {
        headers: {
          'X-Org-Id': 'ORG-001',
          'X-Correlation-Id': 'test-404',
        },
      });
    });

    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(404);

    const errorResponseHeaders = errorResponse.headers();
    expect(errorResponseHeaders['x-org-id']).toBeTruthy();
    expect(errorResponseHeaders['x-correlation-id']).toBeTruthy();

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 404);
    expect(errorBody.detail).toContain('introuvable');
  });

  test('Scenario 4: Test error handling - 403 Forbidden', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    await page.route(/\/api\/v1\/messages$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          headers: {
            'X-Org-Id': 'ORG-001',
            'X-Correlation-Id': 'test-correlation-id-403',
          },
          body: JSON.stringify({
            type: 'about:blank',
            title: 'Forbidden',
            status: 403,
            detail: "Vous n'avez pas les droits nécessaires pour créer un message",
            instance: '/api/v1/messages',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `Test Lead Forbidden ${timestamp}`,
      `+336123456${timestamp.toString().slice(-2)}`
    );

    cleanup.trackDossier(dossierId);

    await helpers.switchToTab('Messages');

    await helpers.waitForApiResponse(/\/api\/v1\/messages\?.*dossierId=\d+/, {
      expectedStatus: 200,
    });

    await helpers.clickButton('button:has-text("Nouveau message")');
    await helpers.waitForDialog();

    await helpers.selectOption('select#channel, select[name="channel"]', 'EMAIL');
    await helpers.selectOption('select#direction, select[name="direction"]', 'INBOUND');
    await helpers.fillFormField('textarea#content, textarea[name="content"]', 'Test forbidden message');
    await page.locator('input[type="datetime-local"]').fill(new Date().toISOString().substring(0, 16));

    const errorResponsePromise = helpers.waitForApiCall(/\/api\/v1\/messages/, {
      expectedStatus: 403,
    });

    await helpers.clickButton(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );

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
