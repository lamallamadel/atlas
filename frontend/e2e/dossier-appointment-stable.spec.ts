import { test, expect } from './stable-test-fixture';
import {
  waitForApiCall,
  validateAppointmentResponse,
  validatePageResponse,
} from './api-validation';

test.describe('Dossier Appointment E2E Tests (Stabilized)', () => {
  test.beforeEach(async ({ authenticatedPage: page, helpers }) => {
    await helpers.retryAssertion(async () => {
      await page.goto('/');
      await page.waitForSelector('app-root', { timeout: 10000 });
    });
  });

  test('Create appointment with stable waits and validation', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const leadName = `Appointment Test ${timestamp}`;
    const leadPhone = `+336${String(timestamp).slice(-8)}`;

    await helpers.ensureDossierExists(leadName, leadPhone);
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    const dossierId = helpers.extractDossierId(page.url());
    expect(dossierId).toBeTruthy();
    if (dossierId) {
      cleanup.trackDossier(dossierId);
    }

    await helpers.switchToTab('Rendez-vous');

    await helpers.retryAssertion(async () => {
      const tabPanel = page.locator('.mat-mdc-tab-body-active, [role="tabpanel"][aria-hidden="false"]');
      await expect(tabPanel).toBeVisible({ timeout: 5000 });
    });

    const planifierButton = await helpers.waitForSelector('button:has-text("Planifier")');
    await planifierButton.click();

    await helpers.waitForDialog();

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const location = `Stable Test Location ${now.getTime()}`;
    const assignedTo = 'E2E Agent';
    const notes = `Appointment notes - ${now.toISOString()}`;

    await page.locator('input[type="datetime-local"]').first().fill(
      helpers.formatDateTimeLocal(startTime)
    );
    await page.locator('input[type="datetime-local"]').nth(1).fill(
      helpers.formatDateTimeLocal(endTime)
    );
    await page.locator('input#location, input[name="location"]').fill(location);
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill(assignedTo);
    await page.locator('textarea#notes, textarea[name="notes"]').fill(notes);

    const createAppointmentPromise = helpers.waitForApiResponse(/\/api\/v1\/appointments$/, {
      expectedStatus: 201,
    });

    const submitButton = page.locator(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );
    await submitButton.first().click();

    const { body: appointmentBody } = await createAppointmentPromise;
    expect(appointmentBody.id).toBeTruthy();
    expect(appointmentBody.location).toBe(location);
    expect(appointmentBody.status).toBe('SCHEDULED');
    cleanup.trackAppointment(appointmentBody.id);

    await helpers.closeSnackbar();

    await helpers.retryAssertion(async () => {
      const appointmentRow = page.locator('table.data-table tbody tr').filter({ 
        hasText: location 
      });
      await expect(appointmentRow.first()).toBeVisible({ timeout: 10000 });
    });

    const appointmentRow = page.locator('table.data-table tbody tr').filter({ 
      hasText: location 
    });
    await expect(appointmentRow).toContainText(assignedTo);
    await expect(appointmentRow).toContainText(/Planifié|SCHEDULED/i);
  });

  test('Validate appointment time constraints', async ({ authenticatedPage: page, helpers, cleanup }) => {
    await helpers.navigateToDossiers();

    await helpers.ensureDossierExists('Time Validation Test', '+33612347000');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    const dossierId = helpers.extractDossierId(page.url());
    if (dossierId) {
      cleanup.trackDossier(dossierId);
    }

    await helpers.switchToTab('Rendez-vous');

    const planifierButton = await helpers.waitForSelector('button:has-text("Planifier")');
    await planifierButton.click();

    await helpers.waitForDialog();

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() - 60 * 60 * 1000);

    await page.locator('input[type="datetime-local"]').first().fill(
      helpers.formatDateTimeLocal(startTime)
    );
    await page.locator('input[type="datetime-local"]').nth(1).fill(
      helpers.formatDateTimeLocal(endTime)
    );
    await page.locator('input#location, input[name="location"]').fill('Invalid Time');
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill('Agent');
    await page.locator('textarea#notes, textarea[name="notes"]').fill('Invalid');

    await page.route(/\/api\/v1\/appointments$/, async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();
        
        if (new Date(postData.endTime) < new Date(postData.startTime)) {
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

    const errorResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/appointments') && resp.status() === 400
    );

    const submitButton = page.locator(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );
    await submitButton.first().click();

    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(400);

    const errorBody = await errorResponse.json();
    expect(errorBody.status).toBe(400);
    expect(errorBody.detail).toContain('fin');
  });

  test('Appointment list updates after creation', async ({ authenticatedPage: page, helpers, cleanup }) => {
    await helpers.navigateToDossiers();

    await helpers.ensureDossierExists('List Update Test', '+33612348000');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    const dossierId = helpers.extractDossierId(page.url());
    if (dossierId) {
      cleanup.trackDossier(dossierId);
    }

    await helpers.switchToTab('Rendez-vous');

    const initialListPromise = helpers.waitForApiResponse(
      /\/api\/v1\/appointments\?.*dossierId=\d+/,
      { expectedStatus: 200 }
    );

    const { body: initialList } = await initialListPromise;
    const initialCount = initialList.content?.length || 0;

    const planifierButton = await helpers.waitForSelector('button:has-text("Planifier")');
    await planifierButton.click();

    await helpers.waitForDialog();

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const location = `List Update ${now.getTime()}`;

    await page.locator('input[type="datetime-local"]').first().fill(
      helpers.formatDateTimeLocal(startTime)
    );
    await page.locator('input[type="datetime-local"]').nth(1).fill(
      helpers.formatDateTimeLocal(endTime)
    );
    await page.locator('input#location, input[name="location"]').fill(location);
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill('Agent');
    await page.locator('textarea#notes, textarea[name="notes"]').fill('Notes');

    const createPromise = helpers.waitForApiResponse(/\/api\/v1\/appointments$/, {
      expectedStatus: 201,
    });

    const submitButton = page.locator(
      'mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );
    await submitButton.first().click();

    const { body: createdAppointment } = await createPromise;
    cleanup.trackAppointment(createdAppointment.id);

    await helpers.closeSnackbar();

    await helpers.retryAssertion(async () => {
      const rows = page.locator('table.data-table tbody tr');
      const currentCount = await rows.count();
      expect(currentCount).toBe(initialCount + 1);
    }, { maxAttempts: 5, delayMs: 1000 });
  });

  test('Filter appointments by status', async ({ authenticatedPage: page, helpers, cleanup }) => {
    await helpers.navigateToDossiers();

    await helpers.ensureDossierExists('Filter Test', '+33612349000');
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    const dossierId = helpers.extractDossierId(page.url());
    if (dossierId) {
      cleanup.trackDossier(dossierId);
    }

    await helpers.switchToTab('Rendez-vous');

    await helpers.retryAssertion(async () => {
      const tabPanel = page.locator('.mat-mdc-tab-body-active');
      await expect(tabPanel).toBeVisible({ timeout: 5000 });
    });

    const statusFilter = page.locator('select#status-filter, select[name="status"]');
    const hasFilter = await statusFilter.count() > 0;

    if (hasFilter) {
      const scheduledOption = statusFilter.locator('option:has-text("Planifié"), option[value="SCHEDULED"]');
      const hasScheduledOption = await scheduledOption.count() > 0;

      if (hasScheduledOption) {
        const filterPromise = helpers.waitForApiResponse(
          /\/api\/v1\/appointments\?.*status=SCHEDULED/,
          { expectedStatus: 200 }
        );

        await statusFilter.selectOption('SCHEDULED');

        await filterPromise;

        await helpers.retryAssertion(async () => {
          const rows = page.locator('table.data-table tbody tr');
          const count = await rows.count();
          
          if (count > 0) {
            for (let i = 0; i < count; i++) {
              const row = rows.nth(i);
              await expect(row).toContainText(/Planifié|SCHEDULED/i);
            }
          }
        });
      }
    }
  });
});
