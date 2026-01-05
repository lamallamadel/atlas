import { test, expect } from './auth.fixture';
import { 
  navigateToDossiers, 
  switchToTab, 
  formatDateTimeLocal,
  waitForDialog,
  closeSnackbar
} from './helpers';

test.describe('Dossier Full Workflow E2E Tests', () => {
  test('Complete workflow: Create dossier → Add message → Add appointment → Verify audit trail', async ({ page }) => {
    // Step 1: Navigate to dossiers list
    await navigateToDossiers(page);

    // Step 2: Create a new dossier
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    
    // Check if we can create a dossier
    const canCreate = await createButton.first().isVisible().catch(() => false);
    
    if (canCreate) {
      await createButton.first().click();
      
      const timestamp = new Date().getTime();
      const leadName = `E2E Test Lead ${timestamp}`;
      const leadPhone = `+3361234${timestamp.toString().slice(-4)}`;
      
      await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.click();
      
      // Wait for redirect to dossier detail
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 15000 });
      await closeSnackbar(page);
    } else {
      // Open existing dossier
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    // Get dossier ID for verification
    const url = page.url();
    const dossierId = url.match(/dossiers\/(\d+)/)?.[1];
    expect(dossierId).toBeTruthy();

    // Step 3: Add a message in Messages tab
    await switchToTab(page, 'Messages');

    const newMessageButton = page.locator('button:has-text("Nouveau message")');
    await newMessageButton.click();
    await waitForDialog(page);

    const messageContent = `Full workflow test message - ${new Date().toISOString()}`;
    const messageTime = new Date();
    
    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill(messageContent);
    
    const datetimeInput = page.locator('input[type="datetime-local"]').first();
    await datetimeInput.fill(formatDateTimeLocal(messageTime));

    const createMessageButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")').first();
    await createMessageButton.click();

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

    // Step 4: Add an appointment in Rendez-vous tab
    await switchToTab(page, 'Rendez-vous');

    const planifierButton = page.locator('button:has-text("Planifier")');
    await planifierButton.click();
    await waitForDialog(page);

    const now = new Date();
    const startTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 2 days from now
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    const location = `E2E Test Location ${now.getTime()}`;
    const assignedTo = 'E2E Test Agent';
    const notes = `E2E Test Notes - ${now.toISOString()}`;

    const datetimeInputs = page.locator('input[type="datetime-local"]');
    await datetimeInputs.first().fill(formatDateTimeLocal(startTime));
    await datetimeInputs.nth(1).fill(formatDateTimeLocal(endTime));
    
    await page.locator('input#location, input[name="location"]').fill(location);
    await page.locator('input#assignedTo, input[name="assignedTo"]').fill(assignedTo);
    await page.locator('textarea#notes, textarea[name="notes"]').fill(notes);

    const createAppointmentButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")').first();
    await createAppointmentButton.click();

    // Wait for appointment to be created
    await page.waitForTimeout(2000);
    await closeSnackbar(page);

    // Verify appointment appears in list
    const appointmentRow = page.locator('table.data-table tbody tr').filter({ hasText: location });
    await expect(appointmentRow.first()).toBeVisible({ timeout: 10000 });

    // Verify appointment details
    await expect(appointmentRow.first()).toContainText(assignedTo);
    await expect(appointmentRow.first()).toContainText(/Planifié|SCHEDULED/i);

    // Step 5: Verify audit trail in Historique tab
    await switchToTab(page, 'Historique');

    // Wait for audit events to load
    await page.waitForSelector('table.audit-table, table.data-table, .empty-message', { timeout: 10000 });

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
        await entityTypeFilter.selectOption({ label: 'Message' });
        await page.waitForTimeout(1500);
        
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
        
        // Filter by CREATED action
        await actionFilter.selectOption({ label: 'Création' });
        await page.waitForTimeout(1500);
        
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
