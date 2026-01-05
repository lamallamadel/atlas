import { test, expect } from './auth.fixture';
import { DossiersListPage } from './pages/dossiers-list.page';
import { DossierDetailPage } from './pages/dossier-detail.page';
import { formatDateTimeLocal } from './helpers';

test.describe('Dossier E2E Tests - Page Object Model', () => {
  test('Add message using POM pattern', async ({ page }) => {
    const dossiersPage = new DossiersListPage(page);
    const dossierDetailPage = new DossierDetailPage(page);

    // Navigate to dossiers
    await dossiersPage.goto();

    // Open or create dossier
    const hasDossiers = await dossiersPage.hasDossiers();
    if (!hasDossiers) {
      const timestamp = new Date().getTime();
      await dossiersPage.createDossier(
        `POM Test Lead ${timestamp}`,
        `+3361234${timestamp.toString().slice(-4)}`
      );
    } else {
      await dossiersPage.openFirstDossier();
    }

    // Add message
    const messageContent = `POM test message - ${new Date().toISOString()}`;
    const messageTime = formatDateTimeLocal(new Date());
    
    await dossierDetailPage.addMessage('EMAIL', 'INBOUND', messageContent, messageTime);

    // Verify message exists
    await expect(page.locator('.message-card').filter({ hasText: messageContent })).toBeVisible({ timeout: 10000 });
  });

  test('Add appointment and verify audit using POM pattern', async ({ page }) => {
    const dossiersPage = new DossiersListPage(page);
    const dossierDetailPage = new DossierDetailPage(page);

    // Navigate to dossiers
    await dossiersPage.goto();

    // Open or create dossier
    const hasDossiers = await dossiersPage.hasDossiers();
    if (!hasDossiers) {
      const timestamp = new Date().getTime();
      await dossiersPage.createDossier(
        `POM Appointment Test ${timestamp}`,
        `+3361234${timestamp.toString().slice(-4)}`
      );
    } else {
      await dossiersPage.openFirstDossier();
    }

    // Prepare appointment data
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const location = `POM Location ${now.getTime()}`;

    // Add appointment
    await dossierDetailPage.addAppointment(
      formatDateTimeLocal(startTime),
      formatDateTimeLocal(endTime),
      location,
      'POM Agent',
      'POM test notes'
    );

    // Verify appointment exists
    const appointmentVisible = await dossierDetailPage.verifyAppointmentExists(location);
    expect(appointmentVisible).toBeTruthy();

    // Verify audit events
    const auditEventCount = await dossierDetailPage.getAuditEvents();
    expect(auditEventCount).toBeGreaterThan(0);

    // Filter by creation action
    await dossierDetailPage.filterAuditByAction('Création');
    await page.waitForTimeout(1000);

    // Verify creation events exist
    const creationEvents = page.locator('table tbody tr').filter({ hasText: /Création|CREATE/i });
    const count = await creationEvents.count();
    expect(count).toBeGreaterThan(0);
  });
});
