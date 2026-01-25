import { test, expect } from './stable-test-fixture';
import {
  waitForApiCall,
  validateDossierResponse,
  validateMessageResponse,
  validateAppointmentResponse,
  validateAuditEventResponse,
  validatePageResponse,
  validateResponseHeaders,
  validateRequestHeaders,
} from './api-validation';

test.describe('Dossier Full Workflow E2E Tests', () => {
  test('Complete workflow: Create dossier → Add message → Add appointment → Verify audit trail', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `Test Lead Full Workflow ${timestamp}`,
      `+336123${timestamp.toString().slice(-4)}`
    );

    cleanup.trackDossier(dossierId);

    await expect(page).toHaveURL(/.*dossiers\/\d+/);

    await helpers.closeSnackbar();

    const messagesListPromise = helpers.waitForApiResponse(/\/api\/v1\/messages\?.*dossierId=\d+/, {
      expectedStatus: 200,
    });

    await helpers.switchToTab('Messages');

    await messagesListPromise;

    await helpers.clickButton('button:has-text("Nouveau message")');
    await helpers.waitForDialog();

    const messageContent = `Full workflow test message - ${new Date().toISOString()}`;
    const messageTime = new Date();

    await helpers.selectOption('select#channel, select[name="channel"]', 'EMAIL');
    await helpers.selectOption('select#direction, select[name="direction"]', 'INBOUND');
    await helpers.fillFormField('textarea#content, textarea[name="content"]', messageContent);

    const datetimeInput = page.locator('input[type="datetime-local"]').first();
    await datetimeInput.fill(helpers.formatDateTimeLocal(messageTime));

    const createMessagePromise = helpers.waitForApiResponse(/\/api\/v1\/messages$/, {
      expectedStatus: 201,
    });

    await helpers.clickButton(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );

    const { body: messageResponse } = await createMessagePromise;
    expect(messageResponse.id).toBeTruthy();
    expect(messageResponse.channel).toBe('EMAIL');
    expect(messageResponse.direction).toBe('INBOUND');
    expect(messageResponse.content).toBe(messageContent);

    cleanup.trackMessage(messageResponse.id);

    await helpers.closeSnackbar();

    const messageCard = page.locator('.message-card, .timeline-item').filter({ hasText: messageContent });
    await expect(messageCard.first()).toBeVisible({ timeout: 10000 });

    const emailBadge = messageCard.first().locator('.channel-badge').filter({ hasText: 'EMAIL' });
    await expect(emailBadge).toBeVisible();

    const inboundBadge = messageCard
      .first()
      .locator('.direction-badge')
      .filter({ hasText: /Entrant|INBOUND/i });
    await expect(inboundBadge).toBeVisible();

    const appointmentsListPromise = helpers.waitForApiResponse(
      /\/api\/v1\/appointments\?.*dossierId=\d+/,
      {
        expectedStatus: 200,
      }
    );

    await helpers.switchToTab('Rendez-vous');

    await appointmentsListPromise;

    await helpers.clickButton('button:has-text("Planifier")');
    await helpers.waitForDialog();

    const now = new Date();
    const startTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    const location = `E2E Test Location ${now.getTime()}`;
    const assignedTo = 'E2E Test Agent';
    const notes = `E2E Test Notes - ${now.toISOString()}`;

    const datetimeInputs = page.locator('input[type="datetime-local"]');
    await datetimeInputs.first().fill(helpers.formatDateTimeLocal(startTime));
    await datetimeInputs.nth(1).fill(helpers.formatDateTimeLocal(endTime));

    await helpers.fillFormField('input#location, input[name="location"]', location);
    await helpers.fillFormField('input#assignedTo, input[name="assignedTo"]', assignedTo);
    await helpers.fillFormField('textarea#notes, textarea[name="notes"]', notes);

    const createAppointmentPromise = helpers.waitForApiResponse(/\/api\/v1\/appointments$/, {
      expectedStatus: 201,
    });

    await helpers.clickButton(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );

    const { body: appointmentResponse } = await createAppointmentPromise;
    expect(appointmentResponse.id).toBeTruthy();
    expect(appointmentResponse.location).toBe(location);
    expect(appointmentResponse.assignedTo).toBe(assignedTo);
    expect(appointmentResponse.notes).toBe(notes);
    expect(appointmentResponse.status).toBe('SCHEDULED');

    cleanup.trackAppointment(appointmentResponse.id);

    await helpers.closeSnackbar();

    const appointmentRow = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(appointmentRow.first()).toBeVisible({ timeout: 10000 });

    await expect(appointmentRow.first()).toContainText(assignedTo);
    await expect(appointmentRow.first()).toContainText(/Planifié|SCHEDULED/i);

    const auditEventsPromise = helpers.waitForApiResponse(/\/api\/v1\/audit-events\?/, {
      expectedStatus: 200,
    });

    await helpers.switchToTab('Historique');

    await helpers.waitForSelector('table.audit-table, table.data-table, .empty-message');

    const { body: auditEventsResponse } = await auditEventsPromise;
    expect(auditEventsResponse.content).toBeTruthy();
    expect(auditEventsResponse.content.length).toBeGreaterThan(0);

    const auditTable = page.locator('table.audit-table, table.data-table');
    const auditRows = auditTable.locator('tbody tr');
    const rowCount = await auditRows.count();

    expect(rowCount).toBeGreaterThan(0);

    const creationEvents = auditRows.filter({ hasText: /Création|CREATE|CREATED/i });
    const creationCount = await creationEvents.count();

    expect(creationCount).toBeGreaterThan(0);

    const firstAuditEvent = auditRows.first();

    const dateCell = firstAuditEvent.locator('td').first();
    const dateText = await dateCell.textContent();
    expect(dateText).toBeTruthy();
    expect(dateText).toMatch(/\d{2}\/\d{2}\/\d{4}/);

    const entityTypeFilter = page.locator('select#entity-type-filter, select[id*="entity"]');
    const hasFilter = (await entityTypeFilter.count()) > 0;

    if (hasFilter) {
      const messageOption = entityTypeFilter.locator('option:has-text("Message")');
      const hasMessageOption = (await messageOption.count()) > 0;

      if (hasMessageOption) {
        const filteredAuditPromise = helpers.waitForApiResponse(
          /\/api\/v1\/audit-events\?.*entityType=MESSAGE/,
          {
            expectedStatus: 200,
          }
        );

        await entityTypeFilter.selectOption({ label: 'Message' });

        await filteredAuditPromise;

        const messageCreationEvent = auditRows.filter({ hasText: /MESSAGE|Message/i });
        const hasMessageEvent = (await messageCreationEvent.count()) > 0;
        expect(hasMessageEvent).toBeTruthy();
      }
    }

    const actionFilter = page.locator('select#action-filter, select[id*="action"]');
    const hasActionFilter = (await actionFilter.count()) > 0;

    if (hasActionFilter) {
      const createdOption = actionFilter.locator(
        'option:has-text("Création"), option[value="CREATED"]'
      );
      const hasCreatedOption = (await createdOption.count()) > 0;

      if (hasCreatedOption) {
        if (hasFilter) {
          await entityTypeFilter.selectOption('');
          await page.waitForTimeout(500);
        }

        const actionFilteredPromise = helpers.waitForApiResponse(
          /\/api\/v1\/audit-events\?.*action=CREATED/,
          {
            expectedStatus: 200,
          }
        );

        await actionFilter.selectOption({ label: 'Création' });

        await actionFilteredPromise;

        const visibleRows = await auditRows.count();
        if (visibleRows > 0) {
          const allCreationEvents = auditRows.filter({ hasText: /Création|CREATE|CREATED/i });
          const creationEventCount = await allCreationEvents.count();

          expect(creationEventCount).toBeGreaterThan(0);
        }
      }
    }

    await helpers.switchToTab('Messages');
    const persistedMessage = page
      .locator('.message-card, .timeline-item')
      .filter({ hasText: messageContent });
    await expect(persistedMessage.first()).toBeVisible({ timeout: 5000 });

    await helpers.switchToTab('Rendez-vous');
    const persistedAppointment = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(persistedAppointment.first()).toBeVisible({ timeout: 5000 });
  });
});
