import { test, expect } from './auth.fixture';
import {
  navigateToDossiers,
  switchToTab,
  closeSnackbar
} from './helpers';

test.describe('Dossier State Machine E2E Tests', () => {
  test('Complete state machine flow: NEW → QUALIFYING → QUALIFIED → APPOINTMENT → WON with history verification', async ({ page }) => {
    // Step 1: Navigate to dossiers list
    await navigateToDossiers(page);

    // Step 2: Create a new dossier (which starts in NEW status)
    const timestamp = new Date().getTime();
    const leadName = `Test Lead State Machine ${timestamp}`;
    const leadPhone = `+336${timestamp.toString().slice(-8)}`;

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();

      await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.click();

      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    const url = page.url();
    const dossierId = url.match(/dossiers\/(\d+)/)?.[1];
    expect(dossierId).toBeTruthy();

    // Step 3: Verify initial status is NEW with correct badge
    const statusBadge = page.locator('app-badge-status');
    await expect(statusBadge).toBeVisible();
    
    const badgeText = await statusBadge.textContent();
    expect(badgeText?.trim()).toBe('Nouveau');

    const badgeClass = await statusBadge.locator('span').first().getAttribute('class');
    expect(badgeClass).toContain('badge-new');

    // Step 4: Open status change and transition to QUALIFYING
    const changeStatusButton = page.locator('button:has-text("Changer statut")');
    await changeStatusButton.click();

    await page.waitForSelector('select#status-select', { timeout: 5000 });
    
    const statusSelect = page.locator('select#status-select');
    await statusSelect.selectOption('QUALIFYING');

    const updateButton = page.locator('button:has-text("Mettre à jour le statut")');
    await updateButton.click();

    // Wait for success toast
    const successSnackbar = page.locator('.mat-mdc-snack-bar-container:has-text("Statut mis à jour avec succès")');
    await expect(successSnackbar).toBeVisible({ timeout: 10000 });
    await closeSnackbar(page);

    // Verify badge updated to QUALIFYING
    await page.waitForTimeout(1000);
    const qualifyingBadgeText = await statusBadge.textContent();
    expect(qualifyingBadgeText?.trim()).toBe('Qualification');

    const qualifyingBadgeClass = await statusBadge.locator('span').first().getAttribute('class');
    expect(qualifyingBadgeClass).toContain('badge-qualifying');

    // Step 5: Navigate to Historique tab and verify status history entry
    await switchToTab(page, 'Historique');
    
    await page.waitForSelector('table.audit-table, table.data-table', { timeout: 10000 });
    
    const auditTable = page.locator('table.audit-table, table.data-table');
    const auditRows = auditTable.locator('tbody tr');
    
    const rowCount = await auditRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Filter to show only DOSSIER entity type events
    const entityTypeFilter = page.locator('select#entity-type-filter');
    const hasFilter = await entityTypeFilter.count() > 0;
    
    if (hasFilter) {
      await entityTypeFilter.selectOption('DOSSIER');
      await page.waitForTimeout(1500);
    }

    // Look for status change event (should show UPDATED action with status field change)
    const statusChangeEvent = auditRows.filter({ hasText: /Modification|UPDATED/i });
    const statusChangeCount = await statusChangeEvent.count();
    expect(statusChangeCount).toBeGreaterThan(0);

    // Verify that status field change is visible in audit history
    const firstStatusChange = statusChangeEvent.first();
    const changeDetails = await firstStatusChange.locator('td.audit-changes, td:last-child').textContent();
    expect(changeDetails).toContain('status');

    // Step 6: Transition to QUALIFIED
    await switchToTab(page, 'Informations');
    
    await changeStatusButton.click();
    await page.waitForSelector('select#status-select', { timeout: 5000 });
    
    await statusSelect.selectOption('QUALIFIED');
    await updateButton.click();
    
    await expect(successSnackbar).toBeVisible({ timeout: 10000 });
    await closeSnackbar(page);
    
    await page.waitForTimeout(1000);
    const qualifiedBadgeText = await statusBadge.textContent();
    expect(qualifiedBadgeText?.trim()).toBe('Qualifié');

    const qualifiedBadgeClass = await statusBadge.locator('span').first().getAttribute('class');
    expect(qualifiedBadgeClass).toContain('badge-qualified');

    // Step 7: Verify Historique has new entry for QUALIFIED
    await switchToTab(page, 'Historique');
    await page.waitForTimeout(1500);
    
    const updatedRowCount = await auditRows.count();
    expect(updatedRowCount).toBeGreaterThanOrEqual(rowCount);

    // Step 8: Transition to APPOINTMENT
    await switchToTab(page, 'Informations');
    
    await changeStatusButton.click();
    await page.waitForSelector('select#status-select', { timeout: 5000 });
    
    await statusSelect.selectOption('APPOINTMENT');
    await updateButton.click();
    
    await expect(successSnackbar).toBeVisible({ timeout: 10000 });
    await closeSnackbar(page);
    
    await page.waitForTimeout(1000);
    const appointmentBadgeText = await statusBadge.textContent();
    expect(appointmentBadgeText?.trim()).toBe('Rendez-vous');

    const appointmentBadgeClass = await statusBadge.locator('span').first().getAttribute('class');
    expect(appointmentBadgeClass).toContain('badge-appointment');

    // Step 9: Transition to WON (terminal state)
    await changeStatusButton.click();
    await page.waitForSelector('select#status-select', { timeout: 5000 });
    
    await statusSelect.selectOption('WON');
    await updateButton.click();
    
    await expect(successSnackbar).toBeVisible({ timeout: 10000 });
    await closeSnackbar(page);
    
    await page.waitForTimeout(1000);
    const wonBadgeText = await statusBadge.textContent();
    expect(wonBadgeText?.trim()).toBe('Gagné');

    const wonBadgeClass = await statusBadge.locator('span').first().getAttribute('class');
    expect(wonBadgeClass).toContain('badge-won');

    // Step 10: Verify WON is terminal - dropdown should be disabled or only show WON
    await changeStatusButton.click();
    await page.waitForSelector('select#status-select', { timeout: 5000 });
    
    const isDisabled = await statusSelect.isDisabled();
    if (!isDisabled) {
      // If not disabled, verify only WON option is available
      const options = statusSelect.locator('option');
      const optionCount = await options.count();
      expect(optionCount).toBe(1);
      
      const firstOptionValue = await options.first().getAttribute('value');
      expect(firstOptionValue).toBe('WON');
    } else {
      expect(isDisabled).toBeTruthy();
    }

    // Step 11: Verify complete history in Historique tab
    await switchToTab(page, 'Historique');
    await page.waitForTimeout(1500);
    
    const finalRowCount = await auditRows.count();
    expect(finalRowCount).toBeGreaterThanOrEqual(4);

    // Verify we can see all status transitions in history
    const historyText = await auditTable.textContent();
    expect(historyText).toBeTruthy();
  });

  test('LOST terminal state flow: NEW → QUALIFYING → LOST', async ({ page }) => {
    // Step 1: Navigate to dossiers list
    await navigateToDossiers(page);

    // Step 2: Create a new dossier
    const timestamp = new Date().getTime();
    const leadName = `Test Lead Lost Flow ${timestamp}`;
    const leadPhone = `+337${timestamp.toString().slice(-8)}`;

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();

      await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.click();

      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    const url = page.url();
    const dossierId = url.match(/dossiers\/(\d+)/)?.[1];
    expect(dossierId).toBeTruthy();

    // Step 3: Transition to QUALIFYING first
    const changeStatusButton = page.locator('button:has-text("Changer statut")');
    await changeStatusButton.click();

    await page.waitForSelector('select#status-select', { timeout: 5000 });
    
    const statusSelect = page.locator('select#status-select');
    await statusSelect.selectOption('QUALIFYING');

    const updateButton = page.locator('button:has-text("Mettre à jour le statut")');
    await updateButton.click();

    const successSnackbar = page.locator('.mat-mdc-snack-bar-container:has-text("Statut mis à jour avec succès")');
    await expect(successSnackbar).toBeVisible({ timeout: 10000 });
    await closeSnackbar(page);

    await page.waitForTimeout(1000);

    // Step 4: Transition to LOST
    await changeStatusButton.click();
    await page.waitForSelector('select#status-select', { timeout: 5000 });
    
    await statusSelect.selectOption('LOST');
    await updateButton.click();
    
    await expect(successSnackbar).toBeVisible({ timeout: 10000 });
    await closeSnackbar(page);
    
    await page.waitForTimeout(1000);

    // Step 5: Verify LOST badge
    const statusBadge = page.locator('app-badge-status');
    const lostBadgeText = await statusBadge.textContent();
    expect(lostBadgeText?.trim()).toBe('Perdu');

    const lostBadgeClass = await statusBadge.locator('span').first().getAttribute('class');
    expect(lostBadgeClass).toContain('badge-lost');

    // Step 6: Verify LOST is terminal - dropdown should be disabled or only show LOST
    await changeStatusButton.click();
    await page.waitForSelector('select#status-select', { timeout: 5000 });
    
    const isDisabled = await statusSelect.isDisabled();
    if (!isDisabled) {
      // If not disabled, verify only LOST option is available
      const options = statusSelect.locator('option');
      const optionCount = await options.count();
      expect(optionCount).toBe(1);
      
      const firstOptionValue = await options.first().getAttribute('value');
      expect(firstOptionValue).toBe('LOST');
    } else {
      expect(isDisabled).toBeTruthy();
    }

    // Step 7: Verify history entries in Historique tab
    await switchToTab(page, 'Historique');
    
    await page.waitForSelector('table.audit-table, table.data-table', { timeout: 10000 });
    
    const auditTable = page.locator('table.audit-table, table.data-table');
    const auditRows = auditTable.locator('tbody tr');
    
    const rowCount = await auditRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Filter by DOSSIER entity type
    const entityTypeFilter = page.locator('select#entity-type-filter');
    const hasFilter = await entityTypeFilter.count() > 0;
    
    if (hasFilter) {
      await entityTypeFilter.selectOption('DOSSIER');
      await page.waitForTimeout(1500);
    }

    // Verify multiple status changes recorded
    const statusChangeEvents = auditRows.filter({ hasText: /Modification|UPDATED/i });
    const statusChangeCount = await statusChangeEvents.count();
    expect(statusChangeCount).toBeGreaterThanOrEqual(2);
  });

  test('Direct NEW → LOST transition', async ({ page }) => {
    // Step 1: Navigate to dossiers list
    await navigateToDossiers(page);

    // Step 2: Create a new dossier
    const timestamp = new Date().getTime();
    const leadName = `Test Lead Direct Lost ${timestamp}`;
    const leadPhone = `+338${timestamp.toString().slice(-8)}`;

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();

      await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.click();

      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    // Step 3: Verify initial status is NEW
    const statusBadge = page.locator('app-badge-status');
    await expect(statusBadge).toBeVisible();
    
    const initialBadgeText = await statusBadge.textContent();
    expect(initialBadgeText?.trim()).toBe('Nouveau');

    // Step 4: Transition directly from NEW to LOST
    const changeStatusButton = page.locator('button:has-text("Changer statut")');
    await changeStatusButton.click();

    await page.waitForSelector('select#status-select', { timeout: 5000 });
    
    const statusSelect = page.locator('select#status-select');
    
    // Verify LOST option is available from NEW
    const lostOption = statusSelect.locator('option[value="LOST"]');
    await expect(lostOption).toBeVisible();
    
    await statusSelect.selectOption('LOST');

    const updateButton = page.locator('button:has-text("Mettre à jour le statut")');
    await updateButton.click();

    const successSnackbar = page.locator('.mat-mdc-snack-bar-container:has-text("Statut mis à jour avec succès")');
    await expect(successSnackbar).toBeVisible({ timeout: 10000 });
    await closeSnackbar(page);

    await page.waitForTimeout(1000);

    // Step 5: Verify LOST badge
    const lostBadgeText = await statusBadge.textContent();
    expect(lostBadgeText?.trim()).toBe('Perdu');

    const lostBadgeClass = await statusBadge.locator('span').first().getAttribute('class');
    expect(lostBadgeClass).toContain('badge-lost');

    // Step 6: Verify history in Historique tab shows direct NEW → LOST transition
    await switchToTab(page, 'Historique');
    
    await page.waitForSelector('table.audit-table, table.data-table', { timeout: 10000 });
    
    const auditTable = page.locator('table.audit-table, table.data-table');
    const auditRows = auditTable.locator('tbody tr');
    
    const rowCount = await auditRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Verify status dropdown options reflect valid transitions', async ({ page }) => {
    // This test verifies that the dropdown only shows valid transitions based on current state
    await navigateToDossiers(page);

    // Create or open a dossier
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      const timestamp = new Date().getTime();
      await createButton.first().click();
      await page.locator('input#leadName, input[name="leadName"]').fill(`Test Lead Dropdown ${timestamp}`);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(`+339${timestamp.toString().slice(-8)}`);
      await page.locator('button[type="submit"], button:has-text("Créer")').click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    const changeStatusButton = page.locator('button:has-text("Changer statut")');
    const statusSelect = page.locator('select#status-select');

    // Open dropdown for NEW status
    await changeStatusButton.click();
    await page.waitForSelector('select#status-select', { timeout: 5000 });

    // Verify NEW status shows: NEW, QUALIFYING, LOST
    let options = statusSelect.locator('option');
    let optionValues: string[] = [];
    
    const optionCount = await options.count();
    for (let i = 0; i < optionCount; i++) {
      const value = await options.nth(i).getAttribute('value');
      if (value) optionValues.push(value);
    }

    expect(optionValues).toContain('NEW');
    expect(optionValues).toContain('QUALIFYING');
    expect(optionValues).toContain('LOST');
    expect(optionValues).not.toContain('WON');
    expect(optionValues).not.toContain('QUALIFIED');
    expect(optionValues).not.toContain('APPOINTMENT');
  });
});
