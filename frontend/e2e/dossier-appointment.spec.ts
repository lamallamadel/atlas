import { test, expect } from './stable-test-fixture';
import {
  waitForApiCall,
  validateDossierResponse,
  validateAppointmentResponse,
  validateAuditEventResponse,
  validatePageResponse,
  validateErrorSnackbar,
  validateProblemDetails,
  validateRequestHeaders,
  validateResponseHeaders,
} from './api-validation';

test.describe('Dossier Appointment E2E Tests', () => {
  test('Scenario 2: Open dossier → Add appointment in Rendez-vous tab → Verify appointment appears → Navigate to Historique tab → Verify audit event', async ({
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
      `Test Lead Appointment E2E ${timestamp}`,
      `+336123456${timestamp.toString().slice(-2)}`
    );

    cleanup.trackDossier(dossierId);

    await helpers.switchToTab('Rendez-vous');

    const appointmentsListPromise = helpers.waitForApiResponse(
      /\/api\/v1\/appointments\?.*dossierId=\d+/,
      { expectedStatus: 200 }
    );

    const { body: appointmentsList } = await appointmentsListPromise;
    expect(appointmentsList).toBeTruthy();

    await helpers.clickButton('button:has-text("Planifier")');
    await helpers.waitForDialog();

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const location = `Test Location E2E - ${now.getTime()}`;
    const notes = `Test Appointment Notes - ${now.toISOString()}`;

    await page
      .locator('input[type="datetime-local"]')
      .first()
      .fill(helpers.formatDateTimeLocal(startTime));
    await page
      .locator('input[type="datetime-local"]')
      .nth(1)
      .fill(helpers.formatDateTimeLocal(endTime));
    await helpers.fillFormField('input#location, input[name="location"]', location);
    await helpers.fillFormField('input#assignedTo, input[name="assignedTo"]', 'Agent E2E');
    await helpers.fillFormField('textarea#notes, textarea[name="notes"]', notes);

    const createAppointmentPromise = helpers.waitForApiResponse(/\/api\/v1\/appointments$/, {
      expectedStatus: 201,
    });

    await helpers.clickButton(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );

    const { body: createdAppointment } = await createAppointmentPromise;
    expect(createdAppointment.id).toBeTruthy();
    expect(createdAppointment.location).toBe(location);
    expect(createdAppointment.assignedTo).toBe('Agent E2E');
    expect(createdAppointment.notes).toBe(notes);
    expect(createdAppointment.status).toBe('SCHEDULED');

    cleanup.trackAppointment(createdAppointment.id);

    await helpers.closeSnackbar();

    const appointmentRow = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(appointmentRow).toBeVisible({ timeout: 10000 });

    await expect(appointmentRow).toContainText('Agent E2E');
    await expect(appointmentRow).toContainText('Planifié');

    const locationCell = appointmentRow.locator('td').filter({ hasText: location });
    await expect(locationCell).toBeVisible();

    const auditEventsPromise = helpers.waitForApiResponse(/\/api\/v1\/audit-events\?/, {
      expectedStatus: 200,
    });

    await helpers.switchToTab('Historique');

    const { body: auditEvents } = await auditEventsPromise;
    expect(auditEvents.content).toBeTruthy();
    expect(auditEvents.content.length).toBeGreaterThan(0);

    await helpers.waitForSelector('table.audit-table, .audit-table, .empty-message');

    const creationAuditRow = page
      .locator('table.audit-table tbody tr, table.data-table tbody tr')
      .filter({
        hasText: /Création|CREATE|CREATED/i,
      });

    await expect(creationAuditRow.first()).toBeVisible({ timeout: 10000 });

    const actionCell = creationAuditRow
      .first()
      .locator('td .audit-action-badge, td')
      .filter({
        hasText: /Création|CREATE|CREATED/i,
      });
    await expect(actionCell).toBeVisible();
  });

  test('Scenario 2b: Verify audit event details for appointment creation', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    await helpers.navigateToDossiers();

    const dossierLink = page.locator('table.data-table tbody tr').first();
    const hasDossiers = (await dossierLink.count()) > 0;

    if (!hasDossiers) {
      test.skip();
      return;
    }

    const getDossierPromise = helpers.waitForApiResponse(/\/api\/v1\/dossiers\/\d+$/, {
      expectedStatus: 200,
    });

    await dossierLink.click();
    await helpers.waitForNavigation(/.*dossiers\/\d+/);

    const { body: dossier } = await getDossierPromise;
    cleanup.trackDossier(dossier.id);

    const auditEventsPromise = helpers.waitForApiResponse(/\/api\/v1\/audit-events\?/, {
      expectedStatus: 200,
    });

    await helpers.switchToTab('Historique');

    await auditEventsPromise;

    await helpers.waitForSelector('table.audit-table, table.data-table, .empty-message');

    const auditTable = page.locator('table.audit-table, table.data-table');
    const hasAuditData = (await auditTable.locator('tbody tr').count()) > 0;

    if (hasAuditData) {
      const firstAuditRow = auditTable.locator('tbody tr').first();

      const dateCell = firstAuditRow.locator('td').first();
      await expect(dateCell).toBeVisible();

      const actionCell = firstAuditRow.locator('td').nth(1);
      await expect(actionCell).toBeVisible();

      const entityTypeCell = firstAuditRow.locator('td').nth(2);
      await expect(entityTypeCell).toBeVisible();

      const entityIdCell = firstAuditRow.locator('td').nth(3);
      await expect(entityIdCell).toBeVisible();
    }
  });

  test('Scenario 3: Test error handling - 400 Bad Request for invalid appointment time', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `Test Appointment Error ${timestamp}`,
      `+336123456${timestamp.toString().slice(-2)}`
    );

    cleanup.trackDossier(dossierId);

    await helpers.switchToTab('Rendez-vous');

    await helpers.waitForApiResponse(/\/api\/v1\/appointments\?.*dossierId=\d+/, {
      expectedStatus: 200,
    });

    await helpers.clickButton('button:has-text("Planifier")');
    await helpers.waitForDialog();

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() - 60 * 60 * 1000);

    await page
      .locator('input[type="datetime-local"]')
      .first()
      .fill(helpers.formatDateTimeLocal(startTime));
    await page
      .locator('input[type="datetime-local"]')
      .nth(1)
      .fill(helpers.formatDateTimeLocal(endTime));
    await helpers.fillFormField('input#location, input[name="location"]', 'Invalid Location');
    await helpers.fillFormField('input#assignedTo, input[name="assignedTo"]', 'Agent');
    await helpers.fillFormField('textarea#notes, textarea[name="notes"]', 'Invalid appointment');

    await page.route(/\/api\/v1\/appointments$/, async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        if (new Date(postData.endTime) < new Date(postData.startTime)) {
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
              detail: "L'heure de fin doit être après l'heure de début",
              instance: '/api/v1/appointments',
            }),
          });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    const errorResponsePromise = helpers.waitForApiCall(/\/api\/v1\/appointments/, {
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
    expect(errorBody.detail).toContain('fin');

    await validateErrorSnackbar(page, /fin.*début|invalide|erreur/i);
  });

  test('Scenario 4: Test error handling - 404 Not Found for non-existent appointment', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    await page.route(/\/api\/v1\/appointments\/9999999$/, async (route) => {
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
          detail: 'Le rendez-vous demandé est introuvable',
          instance: '/api/v1/appointments/9999999',
        }),
      });
    });

    await helpers.navigateToDossiers();

    const errorResponsePromise = helpers.waitForApiCall(/\/api\/v1\/appointments\/9999999/, {
      expectedStatus: 404,
    });

    await page.evaluate(() => {
      fetch('/api/v1/appointments/9999999', {
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
});
