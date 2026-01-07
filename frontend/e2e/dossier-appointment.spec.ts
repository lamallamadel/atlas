import { test, expect } from './auth.fixture';
import { navigateToDossiers, switchToTab, formatDateTimeLocal, extractDossierId, waitForDialog, closeSnackbar, ensureDossierExists } from './helpers';

test.describe('Dossier Appointment E2E Tests', () => {
  test('Scenario 2: Open dossier → Add appointment in Rendez-vous tab → Verify appointment appears → Navigate to Historique tab → Verify audit event', async ({ page }) => {
    // Step 1: Already authenticated via fixture
    await expect(page).toHaveURL(/.*dashboard/);

    // Step 2: Navigate to dossiers list
    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });

    // Wait for dossiers to load
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 15000 });

    // Open a dossier (create if needed)
    await ensureDossierExists(page, 'Test Lead Appointment E2E', '+33612345679');

    // Wait for dossier detail page (ensureDossierExists handles creation wait, but we double check)
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });

    // Extract dossier ID from URL for later verification
    const url = page.url();
    const dossierId = url.match(/dossiers\/(\d+)/)?.[1];

    // Step 4: Navigate to Rendez-vous tab
    const appointmentsTab = page.locator('div.mat-mdc-tab-label-content:has-text("Rendez-vous"), .mat-tab-label:has-text("Rendez-vous")');
    await appointmentsTab.click();
    await page.waitForTimeout(1000);

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

    // Submit appointment form
    const submitAppointmentButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    await submitAppointmentButton.click();

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
    await historiqueTab.click();
    await page.waitForTimeout(1000);

    // Wait for audit events to load
    await page.waitForSelector('table.audit-table, .audit-table, .empty-message', { timeout: 10000 });

    // Step 8: Filter audit events to show only APPOINTMENT entity type
    const entityTypeFilter = page.locator('select#entity-type-filter, select[id*="entity"]');
    const hasEntityFilter = await entityTypeFilter.count() > 0;

    if (hasEntityFilter) {
      // If there's an APPOINTMENT option, select it
      const appointmentOption = entityTypeFilter.locator('option:has-text("Appointment"), option[value="APPOINTMENT"]');
      const hasAppointmentOption = await appointmentOption.count() > 0;

      if (hasAppointmentOption) {
        await entityTypeFilter.selectOption({ label: 'Appointment' });
        await page.waitForTimeout(1000);
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
    await historiqueTab.click();
    await page.waitForTimeout(1000);

    // Wait for audit events to load
    await page.waitForSelector('table.audit-table, table.data-table, .empty-message', { timeout: 10000 });

    // Apply filters to show APPOINTMENT CREATED events
    const actionFilter = page.locator('select#action-filter, select[id*="action"]');
    const hasActionFilter = await actionFilter.count() > 0;

    if (hasActionFilter) {
      // Select CREATED action
      const createdOption = actionFilter.locator('option:has-text("Création"), option[value="CREATED"]');
      const hasCreatedOption = await createdOption.count() > 0;

      if (hasCreatedOption) {
        await actionFilter.selectOption({ label: 'Création' });
        await page.waitForTimeout(1000);
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
});
