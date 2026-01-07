import { test, expect } from './auth.fixture';
import { DossiersListPage } from './pages/dossiers-list.page';
import { DossierDetailPage } from './pages/dossier-detail.page';
import { formatDateTimeLocal } from './helpers';
import {
  waitForApiCall,
  validateDossierResponse,
  validateMessageResponse,
  validateAppointmentResponse,
  validateAuditEventResponse,
  validatePageResponse,
  validateRequestHeaders,
  validateProblemDetails,
  validateErrorSnackbar
} from './api-validation';

test.describe('Dossier E2E Tests - Page Object Model', () => {
  test('Add message using POM pattern with API validation', async ({ page }) => {
    const dossiersPage = new DossiersListPage(page);
    const dossierDetailPage = new DossierDetailPage(page);

    // Navigate to dossiers with API validation
    const dossiersListPromise = waitForApiCall(page, /\/api\/v1\/dossiers\?/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateDossierResponse)
    });

    await dossiersPage.goto();

    // Verify API call
    const { request: dossiersRequest } = await dossiersListPromise;
    validateRequestHeaders(dossiersRequest);

    // Open or create dossier
    const hasDossiers = await dossiersPage.hasDossiers();
    if (!hasDossiers) {
      const timestamp = new Date().getTime();
      
      // Wait for dossier creation API call
      const createDossierPromise = waitForApiCall(page, /\/api\/v1\/dossiers$/, {
        expectedStatus: 201,
        validateResponse: validateDossierResponse
      });
      
      await dossiersPage.createDossier(
        `POM Test Lead ${timestamp}`,
        `+3361234${timestamp.toString().slice(-4)}`
      );
      
      // Verify creation API call
      const { request: createRequest, response: createResponse } = await createDossierPromise;
      validateRequestHeaders(createRequest);
      expect(createResponse.id).toBeTruthy();
    } else {
      // Wait for GET dossier API call
      const getDossierPromise = waitForApiCall(page, /\/api\/v1\/dossiers\/\d+$/, {
        expectedStatus: 200,
        validateResponse: validateDossierResponse
      });
      
      await dossiersPage.openFirstDossier();
      
      // Verify GET API call
      const { request: getRequest } = await getDossierPromise;
      validateRequestHeaders(getRequest);
    }

    // Add message with API validation
    const messageContent = `POM test message - ${new Date().toISOString()}`;
    const messageTime = formatDateTimeLocal(new Date());
    
    // Wait for messages list API call when switching to tab
    const messagesListPromise = waitForApiCall(page, /\/api\/v1\/messages\?.*dossierId=\d+/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateMessageResponse)
    });
    
    // Wait for message creation API call
    const createMessagePromise = waitForApiCall(page, /\/api\/v1\/messages$/, {
      expectedStatus: 201,
      validateResponse: (body) => {
        validateMessageResponse(body);
        expect(body.channel).toBe('EMAIL');
        expect(body.direction).toBe('INBOUND');
        expect(body.content).toBe(messageContent);
      }
    });
    
    await dossierDetailPage.addMessage('EMAIL', 'INBOUND', messageContent, messageTime);

    // Verify messages list API call
    const { request: messagesListRequest } = await messagesListPromise;
    validateRequestHeaders(messagesListRequest);

    // Verify create message API call
    const { request: createMessageRequest, response: messageResponse } = await createMessagePromise;
    validateRequestHeaders(createMessageRequest);
    expect(messageResponse.id).toBeTruthy();

    // Verify message exists
    await expect(page.locator('.message-card').filter({ hasText: messageContent })).toBeVisible({ timeout: 10000 });
  });

  test('Add appointment and verify audit using POM pattern with API validation', async ({ page }) => {
    const dossiersPage = new DossiersListPage(page);
    const dossierDetailPage = new DossierDetailPage(page);

    // Navigate to dossiers with API validation
    const dossiersListPromise = waitForApiCall(page, /\/api\/v1\/dossiers\?/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateDossierResponse)
    });

    await dossiersPage.goto();

    // Verify API call
    const { request: dossiersRequest } = await dossiersListPromise;
    validateRequestHeaders(dossiersRequest);

    // Open or create dossier
    const hasDossiers = await dossiersPage.hasDossiers();
    if (!hasDossiers) {
      const timestamp = new Date().getTime();
      
      // Wait for dossier creation API call
      const createDossierPromise = waitForApiCall(page, /\/api\/v1\/dossiers$/, {
        expectedStatus: 201,
        validateResponse: validateDossierResponse
      });
      
      await dossiersPage.createDossier(
        `POM Appointment Test ${timestamp}`,
        `+3361234${timestamp.toString().slice(-4)}`
      );
      
      // Verify creation API call
      const { request: createRequest, response: createResponse } = await createDossierPromise;
      validateRequestHeaders(createRequest);
      expect(createResponse.id).toBeTruthy();
    } else {
      // Wait for GET dossier API call
      const getDossierPromise = waitForApiCall(page, /\/api\/v1\/dossiers\/\d+$/, {
        expectedStatus: 200,
        validateResponse: validateDossierResponse
      });
      
      await dossiersPage.openFirstDossier();
      
      // Verify GET API call
      const { request: getRequest } = await getDossierPromise;
      validateRequestHeaders(getRequest);
    }

    // Prepare appointment data
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const location = `POM Location ${now.getTime()}`;

    // Wait for appointments list API call when switching to tab
    const appointmentsListPromise = waitForApiCall(page, /\/api\/v1\/appointments\?.*dossierId=\d+/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateAppointmentResponse)
    });
    
    // Wait for appointment creation API call
    const createAppointmentPromise = waitForApiCall(page, /\/api\/v1\/appointments$/, {
      expectedStatus: 201,
      validateResponse: (body) => {
        validateAppointmentResponse(body);
        expect(body.location).toBe(location);
        expect(body.assignedTo).toBe('POM Agent');
        expect(body.notes).toBe('POM test notes');
        expect(body.status).toBe('SCHEDULED');
      }
    });
    
    // Add appointment
    await dossierDetailPage.addAppointment(
      formatDateTimeLocal(startTime),
      formatDateTimeLocal(endTime),
      location,
      'POM Agent',
      'POM test notes'
    );

    // Verify appointments list API call
    const { request: appointmentsListRequest } = await appointmentsListPromise;
    validateRequestHeaders(appointmentsListRequest);

    // Verify create appointment API call
    const { request: createAppointmentRequest, response: appointmentResponse } = await createAppointmentPromise;
    validateRequestHeaders(createAppointmentRequest);
    expect(appointmentResponse.id).toBeTruthy();

    // Verify appointment exists
    const appointmentVisible = await dossierDetailPage.verifyAppointmentExists(location);
    expect(appointmentVisible).toBeTruthy();

    // Wait for audit events API call when switching to tab
    const auditEventsPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?/, {
      expectedStatus: 200,
      validateResponse: (body) => {
        validatePageResponse(body, validateAuditEventResponse);
        expect(body.content.length).toBeGreaterThan(0);
      }
    });

    // Verify audit events
    const auditEventCount = await dossierDetailPage.getAuditEvents();
    expect(auditEventCount).toBeGreaterThan(0);

    // Verify audit events API call
    const { request: auditRequest } = await auditEventsPromise;
    validateRequestHeaders(auditRequest);

    // Filter by creation action with API validation
    const filteredAuditPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?.*action=CREATED/, {
      expectedStatus: 200,
      validateResponse: (body) => {
        validatePageResponse(body, validateAuditEventResponse);
        if (body.content.length > 0) {
          body.content.forEach((event: any) => {
            expect(event.action).toBe('CREATED');
          });
        }
      }
    });
    
    await dossierDetailPage.filterAuditByAction('Création');
    await page.waitForTimeout(1000);

    // Verify filtered audit API call
    const { request: filteredAuditRequest } = await filteredAuditPromise;
    validateRequestHeaders(filteredAuditRequest);

    // Verify creation events exist
    const creationEvents = page.locator('table tbody tr').filter({ hasText: /Création|CREATE/i });
    const count = await creationEvents.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Test error handling with POM - 400 Bad Request', async ({ page }) => {
    const dossiersPage = new DossiersListPage(page);
    const dossierDetailPage = new DossierDetailPage(page);

    // Navigate to dossiers
    await dossiersPage.goto();
    await page.waitForTimeout(1000);

    // Open or create dossier
    const hasDossiers = await dossiersPage.hasDossiers();
    if (!hasDossiers) {
      const timestamp = new Date().getTime();
      await dossiersPage.createDossier(
        `POM Error Test ${timestamp}`,
        `+3361234${timestamp.toString().slice(-4)}`
      );
    } else {
      await dossiersPage.openFirstDossier();
    }

    // Navigate to Messages tab
    await dossierDetailPage.switchToTab('Messages');
    await page.waitForTimeout(1000);

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
              'X-Correlation-Id': 'test-correlation-id-400-pom'
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

    // Try to add a message with invalid data
    const newMessageButton = page.locator('button:has-text("Nouveau message")');
    await newMessageButton.click();
    await page.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });

    // Fill in message form with invalid data (empty content)
    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    // Leave content empty
    await page.locator('input[type="datetime-local"]').fill(new Date().toISOString().substring(0, 16));

    // Wait for the error response
    const errorResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/messages') && response.status() === 400
    );

    const submitMessageButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
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

  test('Test error handling with POM - 403 Forbidden', async ({ page }) => {
    const dossiersPage = new DossiersListPage(page);
    const dossierDetailPage = new DossierDetailPage(page);

    // Set up route to intercept and return 403
    await page.route(/\/api\/v1\/appointments$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          headers: {
            'X-Org-Id': 'ORG-001',
            'X-Correlation-Id': 'test-correlation-id-403-pom'
          },
          body: JSON.stringify({
            type: 'about:blank',
            title: 'Forbidden',
            status: 403,
            detail: "Vous n'avez pas les droits nécessaires pour créer un rendez-vous",
            instance: '/api/v1/appointments'
          })
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to dossiers
    await dossiersPage.goto();
    await page.waitForTimeout(1000);

    // Open or create dossier
    const hasDossiers = await dossiersPage.hasDossiers();
    if (!hasDossiers) {
      const timestamp = new Date().getTime();
      await dossiersPage.createDossier(
        `POM Forbidden Test ${timestamp}`,
        `+3361234${timestamp.toString().slice(-4)}`
      );
    } else {
      await dossiersPage.openFirstDossier();
    }

    // Navigate to Rendez-vous tab
    await dossierDetailPage.switchToTab('Rendez-vous');
    await page.waitForTimeout(1000);

    // Try to add an appointment
    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await page.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    // Fill in appointment form
    await page.locator('input[type="datetime-local"]').first().fill(startTime.toISOString().substring(0, 16));
    await page.locator('input[type="datetime-local"]').nth(1).fill(endTime.toISOString().substring(0, 16));
    await page.locator('input#location, input[name="location"]').fill('Forbidden Location');
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill('Agent');
    await page.locator('textarea#notes, textarea[name="notes"]').fill('Forbidden appointment');

    // Wait for the error response
    const errorResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/appointments') && response.status() === 403
    );

    const submitAppointmentButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    await submitAppointmentButton.click();

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
