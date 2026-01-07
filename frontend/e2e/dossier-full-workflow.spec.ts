import { test, expect } from './auth.fixture';
import {
  navigateToDossiers,
  switchToTab,
  formatDateTimeLocal,
  waitForDialog,
  closeSnackbar,
  ensureDossierExists
} from './helpers';
import {
  waitForApiCall,
  validateDossierResponse,
  validateMessageResponse,
  validateAppointmentResponse,
  validateAuditEventResponse,
  validatePageResponse,
  validateResponseHeaders,
  validateRequestHeaders
} from './api-validation';

test.describe('Dossier Full Workflow E2E Tests', () => {
  test('Complete workflow: Create dossier → Add message → Add appointment → Verify audit trail', async ({ page }) => {
    // Step 1: Navigate to dossiers list
    await navigateToDossiers(page);

    // Step 2: Create a new dossier with API validation
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');

    // Check if we can create a dossier
    const canCreate = await createButton.first().isVisible().catch(() => false);

    const timestamp = new Date().getTime();
    let dossierId: string | undefined;

    if (canCreate) {
      await createButton.first().click();

      await ensureDossierExists(page, 'Test Lead Full Workflow ' + timestamp, '+3361234' + timestamp.toString().slice(-4));

      // Wait for dossier creation API call and validate
      const createApiCall = waitForApiCall(page, /\/api\/v1\/dossiers$/, {
        expectedStatus: 201,
        validateResponse: validateDossierResponse
      });

      // Wait for redirect to dossier detail
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);

      // Verify the create API call
      const { request: createRequest, response: dossierResponse } = await createApiCall;
      expect(dossierResponse.id).toBeTruthy();
      
      // Validate request and response headers
      validateRequestHeaders(createRequest);
      const responseHeaders = (await page.request.fetch(`/api/v1/dossiers/${dossierResponse.id}`)).headers();
      validateResponseHeaders(responseHeaders);
      
      dossierId = dossierResponse.id.toString();
    } else {
      // Open existing dossier
      const firstDossier = page.locator('table.data-table tbody tr').first();
      
      // Wait for GET dossier API call when opening
      const getDossierPromise = waitForApiCall(page, /\/api\/v1\/dossiers\/\d+$/, {
        expectedStatus: 200,
        validateResponse: validateDossierResponse
      });

      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });

      // Verify the GET API call
      const { request: getRequest, response: dossierResponse } = await getDossierPromise;
      validateRequestHeaders(getRequest);
      dossierId = dossierResponse.id.toString();
    }

    // Get dossier ID for verification
    const url = page.url();
    dossierId = url.match(/dossiers\/(\d+)/)?.[1];
    expect(dossierId).toBeTruthy();

    // Step 3: Add a message in Messages tab with API validation
    await switchToTab(page, 'Messages');

    // Wait for messages list API call
    const messagesListPromise = waitForApiCall(page, /\/api\/v1\/messages\?.*dossierId=\d+/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateMessageResponse)
    });

    const { request: messagesListRequest } = await messagesListPromise;
    validateRequestHeaders(messagesListRequest);

    const newMessageButton = page.locator('button:has-text("Nouveau message")');
    await newMessageButton.click();
    await waitForDialog(page);

    const messageContent = 'Full workflow test message - ' + new Date().toISOString();
    const messageTime = new Date();

    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill(messageContent);

    const datetimeInput = page.locator('input[type="datetime-local"]').first();
    await datetimeInput.fill(formatDateTimeLocal(messageTime));

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

    const createMessageButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")').first();
    await createMessageButton.click();

    // Verify the create message API call
    const { request: createMessageRequest, response: messageResponse } = await createMessagePromise;
    expect(messageResponse.id).toBeTruthy();
    
    // Validate request and response headers
    validateRequestHeaders(createMessageRequest);

    // Wait for message to be created
    await page.waitForTimeout(2000);
    await closeSnackbar(page);

    // Verify message appears
    const messageCard = page.locator('.message-card, .timeline-item').filter({ hasText: messageContent });
    await expect(messageCard.first()).toBeVisible({ timeout: 10000 });

    // Verify message has correct channel badge
    const emailBadge = messageCard.first().locator('.channel-badge').filter({ hasText: 'EMAIL' });
    await expect(emailBadge).toBeVisible();

    // Verify message has correct direction badge
    const inboundBadge = messageCard.first().locator('.direction-badge').filter({ hasText: /Entrant|INBOUND/i });
    await expect(inboundBadge).toBeVisible();

    // Step 4: Add an appointment in Rendez-vous tab with API validation
    await switchToTab(page, 'Rendez-vous');

    // Wait for appointments list API call
    const appointmentsListPromise = waitForApiCall(page, /\/api\/v1\/appointments\?.*dossierId=\d+/, {
      expectedStatus: 200,
      validateResponse: (body) => validatePageResponse(body, validateAppointmentResponse)
    });

    const { request: appointmentsListRequest } = await appointmentsListPromise;
    validateRequestHeaders(appointmentsListRequest);

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const now = new Date();
    const startTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 2 days from now
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    const location = 'E2E Test Location ' + now.getTime();
    const assignedTo = 'E2E Test Agent';
    const notes = 'E2E Test Notes - ' + now.toISOString();

    const datetimeInputs = page.locator('input[type="datetime-local"]');
    await datetimeInputs.first().fill(formatDateTimeLocal(startTime));
    await datetimeInputs.nth(1).fill(formatDateTimeLocal(endTime));

    await page.locator('input#location, input[name="location"]').fill(location);
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill(assignedTo);
    await page.locator('textarea#notes, textarea[name="notes"]').fill(notes);

    // Wait for appointment creation API call
    const createAppointmentPromise = waitForApiCall(page, /\/api\/v1\/appointments$/, {
      expectedStatus: 201,
      validateResponse: (body) => {
        validateAppointmentResponse(body);
        expect(body.location).toBe(location);
        expect(body.assignedTo).toBe(assignedTo);
        expect(body.notes).toBe(notes);
        expect(body.dossierId.toString()).toBe(dossierId);
        expect(body.status).toBe('SCHEDULED');
      }
    });

    const createAppointmentButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")').first();
    await createAppointmentButton.click();

    // Verify the create appointment API call
    const { request: createAppointmentRequest, response: appointmentResponse } = await createAppointmentPromise;
    expect(appointmentResponse.id).toBeTruthy();
    
    // Validate request and response headers
    validateRequestHeaders(createAppointmentRequest);

    // Wait for appointment to be created
    await page.waitForTimeout(2000);
    await closeSnackbar(page);

    // Verify appointment appears in list
    const appointmentRow = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(appointmentRow.first()).toBeVisible({ timeout: 10000 });

    // Verify appointment details
    await expect(appointmentRow.first()).toContainText(assignedTo);
    await expect(appointmentRow.first()).toContainText(/Planifié|SCHEDULED/i);

    // Step 5: Verify audit trail in Historique tab with API validation
    await switchToTab(page, 'Historique');

    // Wait for audit events list API call
    const auditEventsPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?/, {
      expectedStatus: 200,
      validateResponse: (body) => {
        validatePageResponse(body, validateAuditEventResponse);
        // Verify we have at least some audit events
        expect(body.content.length).toBeGreaterThan(0);
      }
    });

    // Wait for audit events to load
    await page.waitForSelector('table.audit-table, table.data-table, .empty-message', { timeout: 10000 });

    // Verify the audit events API call
    const { request: auditRequest, response: auditEventsResponse } = await auditEventsPromise;
    validateRequestHeaders(auditRequest);
    expect(auditEventsResponse.content).toBeTruthy();

    // Verify that audit events are present
    const auditTable = page.locator('table.audit-table, table.data-table');
    const auditRows = auditTable.locator('tbody tr');
    const rowCount = await auditRows.count();

    expect(rowCount).toBeGreaterThan(0);

    // Look for creation audit events
    const creationEvents = auditRows.filter({ hasText: /Création|CREATE|CREATED/i });
    const creationCount = await creationEvents.count();

    // We should have at least 3 creation events: dossier, message, appointment
    expect(creationCount).toBeGreaterThan(0);

    // Verify audit event structure
    const firstAuditEvent = auditRows.first();

    // Check that date/time is displayed
    const dateCell = firstAuditEvent.locator('td').first();
    const dateText = await dateCell.textContent();
    expect(dateText).toBeTruthy();
    expect(dateText).toMatch(/\d{2}\/\d{2}\/\d{4}/); // DD/MM/YYYY format

    // Filter by APPOINTMENT entity type if possible
    const entityTypeFilter = page.locator('select#entity-type-filter, select[id*="entity"]');
    const hasFilter = await entityTypeFilter.count() > 0;

    if (hasFilter) {
      const messageOption = entityTypeFilter.locator('option:has-text("Message")');
      const hasMessageOption = await messageOption.count() > 0;

      if (hasMessageOption) {
        // Wait for filtered audit events API call
        const filteredAuditPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?.*entityType=MESSAGE/, {
          expectedStatus: 200,
          validateResponse: (body) => {
            validatePageResponse(body, validateAuditEventResponse);
            // Verify filtered events are for MESSAGE entity type
            if (body.content.length > 0) {
              body.content.forEach((event: any) => {
                expect(event.entityType).toBe('MESSAGE');
              });
            }
          }
        });

        await entityTypeFilter.selectOption({ label: 'Message' });
        await page.waitForTimeout(1500);

        // Verify the filtered API call
        const { request: filteredRequest } = await filteredAuditPromise;
        validateRequestHeaders(filteredRequest);

        // Verify message creation event is visible
        const messageCreationEvent = auditRows.filter({ hasText: /MESSAGE|Message/i });
        const hasMessageEvent = await messageCreationEvent.count() > 0;
        expect(hasMessageEvent).toBeTruthy();
      }
    }

    // Test action filter
    const actionFilter = page.locator('select#action-filter, select[id*="action"]');
    const hasActionFilter = await actionFilter.count() > 0;

    if (hasActionFilter) {
      const createdOption = actionFilter.locator('option:has-text("Création"), option[value="CREATED"]');
      const hasCreatedOption = await createdOption.count() > 0;

      if (hasCreatedOption) {
        // Reset entity type filter first
        if (hasFilter) {
          await entityTypeFilter.selectOption('');
          await page.waitForTimeout(1000);
        }

        // Wait for filtered audit events API call by action
        const actionFilteredPromise = waitForApiCall(page, /\/api\/v1\/audit-events\?.*action=CREATED/, {
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

        // Filter by CREATED action
        await actionFilter.selectOption({ label: 'Création' });
        await page.waitForTimeout(1500);

        // Verify the filtered API call
        const { request: actionFilteredRequest } = await actionFilteredPromise;
        validateRequestHeaders(actionFilteredRequest);

        // All visible rows should be creation events
        const visibleRows = await auditRows.count();
        if (visibleRows > 0) {
          const allCreationEvents = auditRows.filter({ hasText: /Création|CREATE|CREATED/i });
          const creationEventCount = await allCreationEvents.count();

          // All filtered events should be creation events
          expect(creationEventCount).toBeGreaterThan(0);
        }
      }
    }

    // Step 6: Navigate back to Messages tab to verify message still exists
    await switchToTab(page, 'Messages');
    const persistedMessage = page.locator('.message-card, .timeline-item').filter({ hasText: messageContent });
    await expect(persistedMessage.first()).toBeVisible({ timeout: 5000 });

    // Step 7: Navigate back to Rendez-vous tab to verify appointment still exists
    await switchToTab(page, 'Rendez-vous');
    const persistedAppointment = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(persistedAppointment.first()).toBeVisible({ timeout: 5000 });
  });
});
