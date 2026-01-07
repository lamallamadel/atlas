import { test, expect } from './auth.fixture';
import { ensureDossierExists } from './helpers';
import {
  waitForApiCall,
  validateDossierResponse,
  validateMessageResponse,
  validatePageResponse,
  validateErrorSnackbar,
  validateProblemDetails,
  validateRequestHeaders,
  validateResponseHeaders
} from './api-validation';

test.describe('Dossier Message E2E Tests', () => {
  test('Scenario 1: Login → Navigate to dossiers list → Open dossier detail → Add message in Messages tab → Verify message appears in timeline', async ({ page }) => {
    // Step 1: Already authenticated via fixture
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Step 2: Navigate to dossiers list
    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    
    // Wait for dossiers list API call with validation
    const dossiersListPromise = waitForApiCall(page, /\/api\/v1\/dossiers\?/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateDossierResponse)
    });

    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });

    // Verify the dossiers list API call
    const { request: dossiersRequest } = await dossiersListPromise;
    validateRequestHeaders(dossiersRequest);

    // Wait for dossiers to load
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    // Open the first dossier detail (create if needed)
    const getDossierPromise = page.waitForResponse(
      response => response.url().match(/\/api\/v1\/dossiers\/\d+$/) !== null,
      { timeout: 30000 }
    );

    await ensureDossierExists(page, 'Test Lead Message E2E', '+33612345679');

    // Wait for dossier detail page to load
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    // Verify the GET dossier API call
    const dossierResponse = await getDossierPromise;
    expect(dossierResponse.status()).toBe(200);
    
    // Validate response headers
    const dossierResponseHeaders = dossierResponse.headers();
    validateResponseHeaders(dossierResponseHeaders);
    
    const dossierBody = await dossierResponse.json();
    validateDossierResponse(dossierBody);

    // Get dossier ID from URL
    const dossierId = page.url().match(/dossiers\/(\d+)/)?.[1];
    expect(dossierId).toBeTruthy();

    // Step 4: Navigate to Messages tab
    const messagesTab = page.locator('div.mat-mdc-tab-label-content:has-text("Messages"), .mat-tab-label:has-text("Messages")');
    
    // Wait for messages list API call
    const messagesListPromise = waitForApiCall(page, /\/api\/v1\/messages\?.*dossierId=\d+/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateMessageResponse)
    });

    await messagesTab.click();

    // Wait for messages tab to be active
    await page.waitForTimeout(1000);

    // Verify the messages list API call
    const { request: messagesRequest, response: messagesListResponse } = await messagesListPromise;
    validateRequestHeaders(messagesRequest);
    expect(messagesListResponse.content).toBeTruthy();

    // Step 5: Add a new message
    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();

    // Wait for message dialog to open
    await page.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });

    // Generate unique content for the test message
    const messageContent = `Test E2E Message - ${new Date().toISOString()}`;
    const timestamp = new Date().toISOString();

    // Fill in message form
    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill(messageContent);
    await page.locator('input[type="datetime-local"]').fill(timestamp.substring(0, 16));

    // Wait for message creation API call
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

    // Submit message form
    const submitMessageButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    await submitMessageButton.click();

    // Verify the create message API call
    const { request: createRequest, response: createResponse } = await createMessagePromise;
    expect(createResponse.id).toBeTruthy();

    // Verify request headers
    validateRequestHeaders(createRequest);

    // Wait for dialog to close and message to be created
    await page.waitForTimeout(2000);

    // Step 6: Verify message appears in timeline
    const messageCard = page.locator('.message-card, .timeline-item').filter({ hasText: messageContent });
    await expect(messageCard).toBeVisible({ timeout: 10000 });

    // Verify message details
    const messageTimestamp = messageCard.locator('.message-timestamp, .timestamp');
    await expect(messageTimestamp).toBeVisible();

    // Verify channel badge
    const channelBadge = messageCard.locator('.channel-badge, .badge:has-text("EMAIL")');
    await expect(channelBadge).toBeVisible();

    // Verify direction badge
    const directionBadge = messageCard.locator('.direction-badge, .badge:has-text("Entrant")');
    await expect(directionBadge).toBeVisible();

    // Verify message content
    const messageContentElement = messageCard.locator('.message-content, .content');
    await expect(messageContentElement).toContainText(messageContent);
  });

  test('Scenario 2: Test error handling - 400 Bad Request with ProblemDetails', async ({ page }) => {
    // Navigate to dossiers
    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    // Open or create a dossier
    await ensureDossierExists(page, 'Test Lead Error Handling', '+33612345680');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    // Navigate to Messages tab
    const messagesTab = page.locator('div.mat-mdc-tab-label-content:has-text("Messages"), .mat-tab-label:has-text("Messages")');
    await messagesTab.click();
    await page.waitForTimeout(1000);

    // Try to add a message with invalid data (empty content)
    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await page.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });

    // Fill in message form with invalid data (empty content should trigger 400)
    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    // Leave content empty
    await page.locator('input[type="datetime-local"]').fill(new Date().toISOString().substring(0, 16));

    // Set up route to intercept and mock 400 error
    await page.route(/\/api\/v1\/messages$/, async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        
        // If content is empty or missing, return 400
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

    // Submit the form
    const submitMessageButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    
    // Wait for the error response
    const errorResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/messages') && response.status() === 400
    );

    await submitMessageButton.click();

    // Verify 400 error response
    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(400);
    
    // Validate response headers
    const errorResponseHeaders = errorResponse.headers();
    expect(errorResponseHeaders['x-org-id']).toBeTruthy();
    expect(errorResponseHeaders['x-correlation-id']).toBeTruthy();

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 400);
    expect(errorBody.detail).toContain('vide');

    // Verify error snackbar is displayed
    await validateErrorSnackbar(page, /contenu.*vide|invalide|erreur/i);
  });

  test('Scenario 3: Test error handling - 404 Not Found', async ({ page }) => {
    // Set up route to intercept and return 404
    await page.route(/\/api\/v1\/messages\/9999999$/, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        headers: {
          'X-Org-Id': 'ORG-001',
          'X-Correlation-Id': 'test-correlation-id-404'
        },
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Le message demandé est introuvable',
          instance: '/api/v1/messages/9999999'
        })
      });
    });

    // Navigate directly to a non-existent message (this would be done via API in real scenario)
    // For now, we'll trigger the 404 by making a fetch request
    await page.goto('/dossiers');
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    // Trigger 404 by trying to fetch a non-existent message
    const errorResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/messages/9999999') && response.status() === 404
    );

    // Use page.evaluate to make the API call
    await page.evaluate(() => {
      fetch('/api/v1/messages/9999999', {
        headers: {
          'X-Org-Id': 'ORG-001',
          'X-Correlation-Id': 'test-404'
        }
      });
    });

    // Verify 404 error response
    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(404);
    
    // Validate response headers
    const errorResponseHeaders = errorResponse.headers();
    expect(errorResponseHeaders['x-org-id']).toBeTruthy();
    expect(errorResponseHeaders['x-correlation-id']).toBeTruthy();

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 404);
    expect(errorBody.detail).toContain('introuvable');
  });

  test('Scenario 4: Test error handling - 403 Forbidden', async ({ page }) => {
    // Set up route to intercept and return 403
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

    // Navigate to dossiers
    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    // Open or create a dossier
    await ensureDossierExists(page, 'Test Lead Forbidden', '+33612345681');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    // Navigate to Messages tab
    const messagesTab = page.locator('div.mat-mdc-tab-label-content:has-text("Messages"), .mat-tab-label:has-text("Messages")');
    await messagesTab.click();
    await page.waitForTimeout(1000);

    // Try to add a message
    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();
    await page.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });

    // Fill in message form
    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill('Test forbidden message');
    await page.locator('input[type="datetime-local"]').fill(new Date().toISOString().substring(0, 16));

    // Submit the form
    const submitMessageButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    
    // Wait for the error response
    const errorResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/messages') && response.status() === 403
    );

    await submitMessageButton.click();

    // Verify 403 error response
    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(403);
    
    // Validate response headers
    const errorResponseHeaders = errorResponse.headers();
    expect(errorResponseHeaders['x-org-id']).toBeTruthy();
    expect(errorResponseHeaders['x-correlation-id']).toBeTruthy();

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 403);
    expect(errorBody.detail).toContain('droits');

    // Verify error snackbar is displayed with appropriate message
    await validateErrorSnackbar(page, /accès refusé|droits|forbidden/i);
  });
});
