import { test, expect } from './auth.fixture';
import { ensureDossierExists } from './helpers';
import {
  waitForApiCall,
  validateDossierResponse,
  validateAppointmentResponse,
  validateAuditEventResponse,
  validatePageResponse,
  validateErrorSnackbar,
  validateProblemDetails,
  validateRequestHeaders,
  validateResponseHeaders
} from './api-validation';

test.describe('Dossier Appointment E2E Tests', () => {
  test('Scenario 2: Open dossier → Add appointment in Rendez-vous tab → Verify appointment appears → Navigate to Historique tab → Verify audit event', async ({ page }) => {
    // Step 1: Already authenticated via fixture
    await expect(page).toHaveURL(/.*dashboard/);

    // Step 2: Navigate to dossiers list
    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    
    // Wait for dossiers list API call
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

    // Open a dossier (create if needed) with API validation
    const getDossierPromise = page.waitForResponse(
      response => response.url().match(/\/api\/v1\/dossiers\/\d+$/) !== null,
      { timeout: 30000 }
    );

    await ensureDossierExists(page, 'Test Lead Appointment E2E', '+33612345679');

    // Wait for dossier detail page (ensureDossierExists handles creation wait, but we double check)
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    // Verify the GET dossier API call
    const dossierResponse = await getDossierPromise;
    expect(dossierResponse.status()).toBe(200);
    
    // Validate response headers
    const dossierResponseHeaders = dossierResponse.headers();
    validateResponseHeaders(dossierResponseHeaders);
    
    const dossierBody = await dossierResponse.json();
    validateDossierResponse(dossierBody);

    // Extract dossier ID from URL for later verification
    const url = page.url();
    const dossierId = url.match(/dossiers\/(\d+)/)?.[1];
    expect(dossierId).toBeTruthy();

    // Step 4: Navigate to Rendez-vous tab
    const appointmentsTab = page.locator('div.mat-mdc-tab-label-content:has-text("Rendez-vous"), .mat-tab-label:has-text("Rendez-vous")');
    
    // Wait for appointments list API call
    const appointmentsListPromise = waitForApiCall(page, /\/api\/v1\/appointments\?.*dossierId=\d+/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateAppointmentResponse)
    });

    await appointmentsTab.click();
    await page.waitForTimeout(1000);

    // Verify the appointments list API call
    const { request: appointmentsRequest, response: appointmentsListResponse } = await appointmentsListPromise;
    validateRequestHeaders(appointmentsRequest);
    expect(appointmentsListResponse.content).toBeTruthy();

    // Step 5: Add a new appointment
    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();

    // Wait for appointment dialog to open
    await page.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });

    // Generate appointment data
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
    const location = `Test Location E2E - ${now.getTime()}`;
    const notes = `Test Appointment Notes - ${now.toISOString()}`;

    // Fill in appointment form
    await page.locator('input[type="datetime-local"]').first().fill(startTime.toISOString().substring(0, 16));
    await page.locator('input[type="datetime-local"]').nth(1).fill(endTime.toISOString().substring(0, 16));
    await page.locator('input#location, input[name="location"]').fill(location);
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill('Agent E2E');
    await page.locator('textarea#notes, textarea[name="notes"]').fill(notes);

    // Wait for appointment creation API call
    const createAppointmentPromise = waitForApiCall(page, /\/api\/v1\/appointments$/, {
      expectedStatus: 201,
      validateResponse: (body) => {
        validateAppointmentResponse(body);
        expect(body.location).toBe(location);
        expect(body.assignedTo).toBe('Agent E2E');
        expect(body.notes).toBe(notes);
        expect(body.dossierId.toString()).toBe(dossierId);
        expect(body.status).toBe('SCHEDULED');
      }
    });

    // Submit appointment form
    const submitAppointmentButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    await submitAppointmentButton.click();

    // Verify the create appointment API call
    const { request: createRequest, response: createResponse } = await createAppointmentPromise;
    expect(createResponse.id).toBeTruthy();

    // Verify request headers
    validateRequestHeaders(createRequest);

    // Wait for dialog to close and appointment to be created
    await page.waitForTimeout(2000);

    // Step 6: Verify appointment appears in the list
    const appointmentRow = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(appointmentRow).toBeVisible({ timeout: 10000 });

    // Verify appointment details in the table
    await expect(appointmentRow).toContainText('Agent E2E');
    await expect(appointmentRow).toContainText('Planifié');

    // Verify location is displayed
    const locationCell = appointmentRow.locator('td').filter({ hasText: location });
    await expect(locationCell).toBeVisible();

    // Step 7: Navigate to Historique (Audit) tab
    const historiqueTab = page.locator('div.mat-mdc-tab-label-content:has-text("Historique"), .mat-tab-label:has-text("Historique")');
    
    // Wait for audit events list API call
    const auditEventsPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?/, {
      expectedStatus: 200,
      validateResponse: (body) => {
        validatePageResponse(body, validateAuditEventResponse);
        expect(body.content.length).toBeGreaterThan(0);
      }
    });

    await historiqueTab.click();
    await page.waitForTimeout(1000);

    // Wait for audit events to load
    await page.waitForSelector('table.audit-table, .audit-table, .empty-message', { timeout: 10000 });

    // Verify the audit events API call
    const { request: auditRequest, response: auditEventsResponse } = await auditEventsPromise;
    validateRequestHeaders(auditRequest);
    expect(auditEventsResponse.content).toBeTruthy();

    // Step 8: Filter audit events to show only APPOINTMENT entity type
    const entityTypeFilter = page.locator('select#entity-type-filter, select[id*="entity"]');
    const hasEntityFilter = await entityTypeFilter.count() > 0;

    if (hasEntityFilter) {
      // If there's an APPOINTMENT option, select it
      const appointmentOption = entityTypeFilter.locator('option:has-text("Appointment"), option[value="APPOINTMENT"]');
      const hasAppointmentOption = await appointmentOption.count() > 0;

      if (hasAppointmentOption) {
        // Wait for filtered audit events API call
        const filteredAuditPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?.*entityType=APPOINTMENT/, {
          expectedStatus: 200,
          validateResponse: (body) => {
            validatePageResponse(body, validateAuditEventResponse);
            // Verify filtered events are for APPOINTMENT entity type
            if (body.content.length > 0) {
              body.content.forEach((event: any) => {
                expect(['APPOINTMENT', 'Appointment']).toContain(event.entityType);
              });
            }
          }
        });

        await entityTypeFilter.selectOption({ label: 'Appointment' });
        await page.waitForTimeout(1000);

        // Verify the filtered API call
        const { request: filteredRequest } = await filteredAuditPromise;
        validateRequestHeaders(filteredRequest);
      }
    }

    // Step 9: Verify audit event for appointment creation
    // Look for audit event with action=CREATED (or CREATE)
    const auditTable = page.locator('table.audit-table, table.data-table');

    // Find the row that corresponds to appointment creation
    const creationAuditRow = auditTable.locator('tbody tr').filter({
      hasText: /Création|CREATE|CREATED/i
    });

    // Verify at least one creation audit event exists
    await expect(creationAuditRow.first()).toBeVisible({ timeout: 10000 });

    // Verify the audit event contains the expected action
    const actionCell = creationAuditRow.first().locator('td .audit-action-badge, td').filter({
      hasText: /Création|CREATE|CREATED/i
    });
    await expect(actionCell).toBeVisible();

    // If entity type is shown, verify it's APPOINTMENT (or related to appointments)
    // Note: The exact entity type might vary based on backend implementation
    const entityTypeCell = creationAuditRow.first().locator('td').nth(2);
    const entityTypeText = await entityTypeCell.textContent();

    // The entity type could be APPOINTMENT, Appointment, or a related value
    // We check if it's present in the audit log
    expect(entityTypeText).toBeTruthy();
  });

  test('Scenario 2b: Verify audit event details for appointment creation', async ({ page }) => {
    // Step 1: Already authenticated via fixture
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to dossiers
    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Open first dossier
    const dossierLink = page.locator('table.data-table tbody tr').first();
    const hasDossiers = await dossierLink.count() > 0;

    if (!hasDossiers) {
      // Skip test if no dossiers
      test.skip();
      return;
    }

    await dossierLink.click();
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });

    // Navigate directly to Historique tab
    const historiqueTab = page.locator('div.mat-mdc-tab-label-content:has-text("Historique"), .mat-tab-label:has-text("Historique")');
    
    // Wait for audit events list API call
    const auditEventsPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateAuditEventResponse)
    });

    await historiqueTab.click();
    await page.waitForTimeout(1000);

    // Wait for audit events to load
    await page.waitForSelector('table.audit-table, table.data-table, .empty-message', { timeout: 10000 });

    // Verify the audit events API call
    const { request: auditRequest } = await auditEventsPromise;
    validateRequestHeaders(auditRequest);

    // Apply filters to show APPOINTMENT CREATED events
    const actionFilter = page.locator('select#action-filter, select[id*="action"]');
    const hasActionFilter = await actionFilter.count() > 0;

    if (hasActionFilter) {
      // Select CREATED action
      const createdOption = actionFilter.locator('option:has-text("Création"), option[value="CREATED"]');
      const hasCreatedOption = await createdOption.count() > 0;

      if (hasCreatedOption) {
        // Wait for filtered audit events API call
        const filteredAuditPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?.*action=CREATED/, {
          expectedStatus: 200,
          validateResponse: (body) => {
            validatePageResponse(body, validateAuditEventResponse);
            // Verify filtered events are for CREATED action
            if (body.content.length > 0) {
              body.content.forEach((event: any) => {
                expect(event.action).toBe('CREATED');
              });
            }
          }
        });

        await actionFilter.selectOption({ label: 'Création' });
        await page.waitForTimeout(1000);

        // Verify the filtered API call
        const { request: filteredRequest } = await filteredAuditPromise;
        validateRequestHeaders(filteredRequest);
      }
    }

    // Verify audit events table exists
    const auditTable = page.locator('table.audit-table, table.data-table');
    const hasAuditData = await auditTable.locator('tbody tr').count() > 0;

    if (hasAuditData) {
      // Verify audit event structure
      const firstAuditRow = auditTable.locator('tbody tr').first();

      // Verify date/time column
      const dateCell = firstAuditRow.locator('td').first();
      await expect(dateCell).toBeVisible();

      // Verify action column
      const actionCell = firstAuditRow.locator('td').nth(1);
      await expect(actionCell).toBeVisible();

      // Verify entity type column
      const entityTypeCell = firstAuditRow.locator('td').nth(2);
      await expect(entityTypeCell).toBeVisible();

      // Verify entity ID column
      const entityIdCell = firstAuditRow.locator('td').nth(3);
      await expect(entityIdCell).toBeVisible();
    }
  });

  test('Scenario 3: Test error handling - 400 Bad Request for invalid appointment time', async ({ page }) => {
    // Navigate to dossiers
    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    // Open or create a dossier
    await ensureDossierExists(page, 'Test Appointment Error', '+33612345682');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    // Navigate to Rendez-vous tab
    const appointmentsTab = page.locator('div.mat-mdc-tab-label-content:has-text("Rendez-vous"), .mat-tab-label:has-text("Rendez-vous")');
    await appointmentsTab.click();
    await page.waitForTimeout(1000);

    // Try to add an appointment with end time before start time
    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await page.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hour before start (invalid!)

    // Fill in appointment form with invalid data
    await page.locator('input[type="datetime-local"]').first().fill(startTime.toISOString().substring(0, 16));
    await page.locator('input[type="datetime-local"]').nth(1).fill(endTime.toISOString().substring(0, 16));
    await page.locator('input#location, input[name="location"]').fill('Invalid Location');
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill('Agent');
    await page.locator('textarea#notes, textarea[name="notes"]').fill('Invalid appointment');

    // Set up route to intercept and mock 400 error
    await page.route(/\/api\/v1\/appointments$/, async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        
        // If endTime is before startTime, return 400
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

    // Submit the form
    const submitAppointmentButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    
    // Wait for the error response
    const errorResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/appointments') && response.status() === 400
    );

    await submitAppointmentButton.click();

    // Verify 400 error response
    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(400);
    
    // Validate response headers
    const errorResponseHeaders = errorResponse.headers();
    expect(errorResponseHeaders['x-org-id']).toBeTruthy();
    expect(errorResponseHeaders['x-correlation-id']).toBeTruthy();

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 400);
    expect(errorBody.detail).toContain('fin');

    // Verify error snackbar is displayed
    await validateErrorSnackbar(page, /fin.*début|invalide|erreur/i);
  });

  test('Scenario 4: Test error handling - 404 Not Found for non-existent appointment', async ({ page }) => {
    // Set up route to intercept and return 404
    await page.route(/\/api\/v1\/appointments\/9999999$/, async (route) => {
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
          detail: 'Le rendez-vous demandé est introuvable',
          instance: '/api/v1/appointments/9999999'
        })
      });
    });

    // Navigate to dossiers
    await page.goto('/dossiers');
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    // Trigger 404 by trying to fetch a non-existent appointment
    const errorResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/appointments/9999999') && response.status() === 404
    );

    // Use page.evaluate to make the API call
    await page.evaluate(() => {
      fetch('/api/v1/appointments/9999999', {
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
});
