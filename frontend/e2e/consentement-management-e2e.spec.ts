import { test, expect } from './auth.fixture';
import {
  navigateToDossiers,
  switchToTab,
  closeSnackbar,
  ensureDossierExists
} from './helpers';

test.describe('Consentement Management E2E Tests', () => {
  test('Complete consent workflow: verify initial states → toggle SMS consent → verify EMAIL consent → verify history', async ({ page }) => {
    // Step 1: Navigate to dossiers list and open/create a dossier
    await navigateToDossiers(page);

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    const timestamp = new Date().getTime();

    if (canCreate) {
      await createButton.first().click();
      await ensureDossierExists(page, 'Test Lead Consent ' + timestamp, '+3362345' + timestamp.toString().slice(-4));
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    // Step 2: Switch to Consentements tab
    await switchToTab(page, 'Consentements');

    // Wait for consent cards to load
    await page.waitForSelector('.consent-cards-grid, .loading-state', { timeout: 10000 });

    // Wait for loading to complete
    const loadingState = page.locator('.loading-state');
    if (await loadingState.isVisible().catch(() => false)) {
      await page.waitForSelector('.consent-cards-grid', { timeout: 10000 });
    }

    // Step 3: Verify initial consent states for SMS and EMAIL channels
    const consentCards = page.locator('.consent-card');
    const consentCardsCount = await consentCards.count();
    expect(consentCardsCount).toBeGreaterThanOrEqual(2); // At least SMS and EMAIL

    // Identify SMS card
    const smsCard = consentCards.filter({ hasText: 'SMS' });
    await expect(smsCard).toBeVisible({ timeout: 5000 });

    // Identify EMAIL card
    const emailCard = consentCards.filter({ hasText: 'Email' });
    await expect(emailCard).toBeVisible({ timeout: 5000 });

    // Verify SMS card initial state
    const smsCardBody = smsCard.locator('.consent-card-body');
    const smsHasConsent = await smsCardBody.locator('.consent-current-status').count() > 0;
    const smsNoConsent = await smsCardBody.locator('.consent-no-status').count() > 0;
    expect(smsHasConsent || smsNoConsent).toBeTruthy();

    // Verify EMAIL card initial state
    const emailCardBody = emailCard.locator('.consent-card-body');
    const emailHasConsent = await emailCardBody.locator('.consent-current-status').count() > 0;
    const emailNoConsent = await emailCardBody.locator('.consent-no-status').count() > 0;
    expect(emailHasConsent || emailNoConsent).toBeTruthy();

    // Step 4: Toggle SMS consent to GRANTED
    const smsGrantedButton = smsCard.locator('button.consent-btn-granted');
    await smsGrantedButton.click();

    // Wait for snackbar and close it
    await page.waitForTimeout(1500);
    await closeSnackbar(page);

    // Step 5: Verify SMS badge updates and green color for GRANTED
    await page.waitForTimeout(1000);

    // Verify GRANTED badge appears with correct styling
    const smsGrantedBadge = smsCard.locator('.consent-badge.consent-granted');
    await expect(smsGrantedBadge).toBeVisible({ timeout: 5000 });
    await expect(smsGrantedBadge).toContainText(/Accordé/i);

    // Verify badge has green color (via CSS class)
    const smsGrantedBadgeClass = await smsGrantedBadge.getAttribute('class');
    expect(smsGrantedBadgeClass).toContain('consent-granted');

    // Verify the granted button is now active and disabled
    const smsGrantedButtonAfter = smsCard.locator('button.consent-btn-granted');
    await expect(smsGrantedButtonAfter).toBeDisabled();
    const smsGrantedButtonClass = await smsGrantedButtonAfter.getAttribute('class');
    expect(smsGrantedButtonClass).toContain('active');

    // Step 6: Toggle SMS consent to REVOKED
    const smsRevokedButton = smsCard.locator('button.consent-btn-revoked');
    await smsRevokedButton.click();

    // Wait for snackbar and close it
    await page.waitForTimeout(1500);
    await closeSnackbar(page);

    // Step 7: Verify SMS badge updates to REVOKED (orange/yellow color)
    await page.waitForTimeout(1000);

    const smsRevokedBadge = smsCard.locator('.consent-badge.consent-revoked');
    await expect(smsRevokedBadge).toBeVisible({ timeout: 5000 });
    await expect(smsRevokedBadge).toContainText(/Révoqué/i);

    // Verify badge has orange/yellow color (via CSS class)
    const smsRevokedBadgeClass = await smsRevokedBadge.getAttribute('class');
    expect(smsRevokedBadgeClass).toContain('consent-revoked');

    // Verify revoked button is now active and disabled
    const smsRevokedButtonAfter = smsCard.locator('button.consent-btn-revoked');
    await expect(smsRevokedButtonAfter).toBeDisabled();
    const smsRevokedButtonClass = await smsRevokedButtonAfter.getAttribute('class');
    expect(smsRevokedButtonClass).toContain('active');

    // Step 8: Test EMAIL channel consent separately
    // Toggle EMAIL consent to GRANTED
    const emailGrantedButton = emailCard.locator('button.consent-btn-granted');
    await emailGrantedButton.click();

    // Wait for snackbar and close it
    await page.waitForTimeout(1500);
    await closeSnackbar(page);

    // Verify EMAIL badge shows GRANTED with green color
    await page.waitForTimeout(1000);
    const emailGrantedBadge = emailCard.locator('.consent-badge.consent-granted');
    await expect(emailGrantedBadge).toBeVisible({ timeout: 5000 });
    await expect(emailGrantedBadge).toContainText(/Accordé/i);

    // Verify green styling
    const emailGrantedBadgeClass = await emailGrantedBadge.getAttribute('class');
    expect(emailGrantedBadgeClass).toContain('consent-granted');

    // Toggle EMAIL to DENIED
    const emailDeniedButton = emailCard.locator('button.consent-btn-denied');
    await emailDeniedButton.click();

    // Wait for snackbar and close it
    await page.waitForTimeout(1500);
    await closeSnackbar(page);

    // Verify EMAIL badge shows DENIED (red color)
    await page.waitForTimeout(1000);
    const emailDeniedBadge = emailCard.locator('.consent-badge.consent-denied');
    await expect(emailDeniedBadge).toBeVisible({ timeout: 5000 });
    await expect(emailDeniedBadge).toContainText(/Refusé/i);

    // Verify badge has red color (via CSS class)
    const emailDeniedBadgeClass = await emailDeniedBadge.getAttribute('class');
    expect(emailDeniedBadgeClass).toContain('consent-denied');

    // Verify denied button is now active and disabled
    const emailDeniedButtonAfter = emailCard.locator('button.consent-btn-denied');
    await expect(emailDeniedButtonAfter).toBeDisabled();

    // Step 9: Expand 'Historique des consentements' accordion
    const historyAccordion = page.locator('.consent-history-section');
    await expect(historyAccordion).toBeVisible();

    const historyAccordionHeader = historyAccordion.locator('.mat-expansion-panel-header');
    await historyAccordionHeader.click();

    // Wait for accordion to expand
    await page.waitForTimeout(1000);

    // Step 10: Verify all status changes are listed with timestamps sorted DESC
    const historyTable = historyAccordion.locator('table.data-table');
    await expect(historyTable).toBeVisible({ timeout: 5000 });

    const historyRows = historyTable.locator('tbody tr');
    const historyRowCount = await historyRows.count();
    
    // We should have at least 4 consent changes: SMS GRANTED, SMS REVOKED, EMAIL GRANTED, EMAIL DENIED
    expect(historyRowCount).toBeGreaterThanOrEqual(4);

    // Verify that SMS status changes are present
    const smsHistoryRows = historyRows.filter({ hasText: 'SMS' });
    const smsHistoryCount = await smsHistoryRows.count();
    expect(smsHistoryCount).toBeGreaterThanOrEqual(2); // GRANTED and REVOKED

    // Verify SMS REVOKED is present (most recent for SMS)
    const smsRevokedRow = historyRows.filter({ has: page.locator('.channel-badge.channel-sms') })
                                      .filter({ has: page.locator('.consent-badge.consent-revoked') });
    await expect(smsRevokedRow.first()).toBeVisible();

    // Verify SMS GRANTED is present
    const smsGrantedRow = historyRows.filter({ has: page.locator('.channel-badge.channel-sms') })
                                      .filter({ has: page.locator('.consent-badge.consent-granted') });
    await expect(smsGrantedRow.first()).toBeVisible();

    // Verify EMAIL status changes are present
    const emailHistoryRows = historyRows.filter({ hasText: 'Email' });
    const emailHistoryCount = await emailHistoryRows.count();
    expect(emailHistoryCount).toBeGreaterThanOrEqual(2); // GRANTED and DENIED

    // Verify EMAIL DENIED is present (most recent for EMAIL)
    const emailDeniedRow = historyRows.filter({ has: page.locator('.channel-badge.channel-email') })
                                       .filter({ has: page.locator('.consent-badge.consent-denied') });
    await expect(emailDeniedRow.first()).toBeVisible();

    // Verify EMAIL GRANTED is present
    const emailGrantedRow = historyRows.filter({ has: page.locator('.channel-badge.channel-email') })
                                        .filter({ has: page.locator('.consent-badge.consent-granted') });
    await expect(emailGrantedRow.first()).toBeVisible();

    // Verify timestamps are present for all rows
    for (let i = 0; i < Math.min(historyRowCount, 5); i++) {
      const row = historyRows.nth(i);
      const dateCell = row.locator('td').nth(2); // Date column (Canal, Statut, Date, Utilisateur)
      const dateText = await dateCell.textContent();
      expect(dateText).toBeTruthy();
      expect(dateText).toMatch(/\d{2}\/\d{2}\/\d{4}/); // DD/MM/YYYY format
    }

    // Verify timestamps are sorted in descending order (most recent first)
    if (historyRowCount >= 2) {
      const firstRowDate = await historyRows.nth(0).locator('td').nth(2).textContent();
      const secondRowDate = await historyRows.nth(1).locator('td').nth(2).textContent();
      
      expect(firstRowDate).toBeTruthy();
      expect(secondRowDate).toBeTruthy();
      
      // Parse dates (format: DD/MM/YYYY HH:MM)
      const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date(0);
        const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
        if (!match) return new Date(0);
        const [, day, month, year, hour, minute] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      };

      const firstDate = parseDate(firstRowDate!);
      const secondDate = parseDate(secondRowDate!);

      // First date should be more recent than or equal to second date
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    }

    // Verify user column is present (may be "—" if not set)
    const firstRowUser = await historyRows.first().locator('td').nth(3).textContent();
    expect(firstRowUser).toBeTruthy();
  });

  test('SMS consent: GRANTED → verify green badge → REVOKED → verify orange/yellow badge', async ({ page }) => {
    // Navigate to dossiers and open a dossier
    await navigateToDossiers(page);

    const timestamp = new Date().getTime();
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();
      await ensureDossierExists(page, 'Test SMS Consent ' + timestamp, '+3362346' + timestamp.toString().slice(-4));
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    // Switch to Consentements tab
    await switchToTab(page, 'Consentements');
    await page.waitForSelector('.consent-cards-grid', { timeout: 10000 });

    // Find SMS card
    const smsCard = page.locator('.consent-card').filter({ hasText: 'SMS' });
    await expect(smsCard).toBeVisible();

    // Set SMS to GRANTED
    const grantedButton = smsCard.locator('button.consent-btn-granted');
    await grantedButton.click();
    await page.waitForTimeout(1500);
    await closeSnackbar(page);
    await page.waitForTimeout(1000);

    // Verify GRANTED badge with green styling
    const grantedBadge = smsCard.locator('.consent-badge.consent-granted');
    await expect(grantedBadge).toBeVisible();
    await expect(grantedBadge).toContainText(/Accordé/i);

    const badgeClass = await grantedBadge.getAttribute('class');
    expect(badgeClass).toContain('consent-granted');

    // Verify button state
    await expect(grantedButton).toBeDisabled();
    const buttonClass = await grantedButton.getAttribute('class');
    expect(buttonClass).toContain('active');

    // Change to REVOKED
    const revokedButton = smsCard.locator('button.consent-btn-revoked');
    await revokedButton.click();
    await page.waitForTimeout(1500);
    await closeSnackbar(page);
    await page.waitForTimeout(1000);

    // Verify REVOKED badge with orange/yellow styling
    const revokedBadge = smsCard.locator('.consent-badge.consent-revoked');
    await expect(revokedBadge).toBeVisible();
    await expect(revokedBadge).toContainText(/Révoqué/i);

    const revokedBadgeClass = await revokedBadge.getAttribute('class');
    expect(revokedBadgeClass).toContain('consent-revoked');

    // Verify button state
    await expect(revokedButton).toBeDisabled();
    const revokedButtonClass = await revokedButton.getAttribute('class');
    expect(revokedButtonClass).toContain('active');
  });

  test('EMAIL consent: GRANTED → DENIED → verify red badge and history', async ({ page }) => {
    // Navigate to dossiers and open a dossier
    await navigateToDossiers(page);

    const timestamp = new Date().getTime();
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();
      await ensureDossierExists(page, 'Test EMAIL Consent ' + timestamp, '+3362347' + timestamp.toString().slice(-4));
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    // Switch to Consentements tab
    await switchToTab(page, 'Consentements');
    await page.waitForSelector('.consent-cards-grid', { timeout: 10000 });

    // Find EMAIL card
    const emailCard = page.locator('.consent-card').filter({ hasText: 'Email' });
    await expect(emailCard).toBeVisible();

    // Set EMAIL to GRANTED
    const grantedButton = emailCard.locator('button.consent-btn-granted');
    await grantedButton.click();
    await page.waitForTimeout(1500);
    await closeSnackbar(page);
    await page.waitForTimeout(1000);

    // Verify GRANTED badge
    const grantedBadge = emailCard.locator('.consent-badge.consent-granted');
    await expect(grantedBadge).toBeVisible();
    await expect(grantedBadge).toContainText(/Accordé/i);

    // Change to DENIED
    const deniedButton = emailCard.locator('button.consent-btn-denied');
    await deniedButton.click();
    await page.waitForTimeout(1500);
    await closeSnackbar(page);
    await page.waitForTimeout(1000);

    // Verify DENIED badge with red styling
    const deniedBadge = emailCard.locator('.consent-badge.consent-denied');
    await expect(deniedBadge).toBeVisible();
    await expect(deniedBadge).toContainText(/Refusé/i);

    const deniedBadgeClass = await deniedBadge.getAttribute('class');
    expect(deniedBadgeClass).toContain('consent-denied');

    // Expand history and verify both changes are recorded
    const historyAccordion = page.locator('.consent-history-section');
    const historyHeader = historyAccordion.locator('.mat-expansion-panel-header');
    await historyHeader.click();
    await page.waitForTimeout(1000);

    const historyTable = historyAccordion.locator('table.data-table');
    const historyRows = historyTable.locator('tbody tr');
    const historyRowCount = await historyRows.count();

    expect(historyRowCount).toBeGreaterThanOrEqual(2);

    // Verify EMAIL GRANTED is in history
    const emailGrantedRow = historyRows.filter({ has: page.locator('.channel-badge.channel-email') })
                                        .filter({ has: page.locator('.consent-badge.consent-granted') });
    await expect(emailGrantedRow.first()).toBeVisible();

    // Verify EMAIL DENIED is in history
    const emailDeniedRow = historyRows.filter({ has: page.locator('.channel-badge.channel-email') })
                                       .filter({ has: page.locator('.consent-badge.consent-denied') });
    await expect(emailDeniedRow.first()).toBeVisible();
  });

  test('Verify consent history is sorted by timestamp descending', async ({ page }) => {
    // Navigate to dossiers and open a dossier
    await navigateToDossiers(page);

    const timestamp = new Date().getTime();
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();
      await ensureDossierExists(page, 'Test History Sort ' + timestamp, '+3362348' + timestamp.toString().slice(-4));
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    // Switch to Consentements tab
    await switchToTab(page, 'Consentements');
    await page.waitForSelector('.consent-cards-grid', { timeout: 10000 });

    // Create multiple consent changes with slight delays
    const smsCard = page.locator('.consent-card').filter({ hasText: 'SMS' });

    // Change 1: GRANTED
    await smsCard.locator('button.consent-btn-granted').click();
    await page.waitForTimeout(1500);
    await closeSnackbar(page);
    await page.waitForTimeout(1000);

    // Change 2: DENIED
    await smsCard.locator('button.consent-btn-denied').click();
    await page.waitForTimeout(1500);
    await closeSnackbar(page);
    await page.waitForTimeout(1000);

    // Change 3: REVOKED
    await smsCard.locator('button.consent-btn-revoked').click();
    await page.waitForTimeout(1500);
    await closeSnackbar(page);
    await page.waitForTimeout(1000);

    // Expand history
    const historyAccordion = page.locator('.consent-history-section');
    const historyHeader = historyAccordion.locator('.mat-expansion-panel-header');
    await historyHeader.click();
    await page.waitForTimeout(1000);

    const historyTable = historyAccordion.locator('table.data-table');
    const historyRows = historyTable.locator('tbody tr');
    const historyRowCount = await historyRows.count();

    expect(historyRowCount).toBeGreaterThanOrEqual(3);

    // Extract and verify timestamps are in descending order
    const timestamps: Date[] = [];
    for (let i = 0; i < Math.min(historyRowCount, 5); i++) {
      const row = historyRows.nth(i);
      const dateCell = row.locator('td').nth(2);
      const dateText = await dateCell.textContent();
      
      if (dateText) {
        const match = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
        if (match) {
          const [, day, month, year, hour, minute] = match;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
          timestamps.push(date);
        }
      }
    }

    // Verify timestamps are in descending order
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i - 1].getTime()).toBeGreaterThanOrEqual(timestamps[i].getTime());
    }
  });

  test('Verify initial consent states for both SMS and EMAIL channels', async ({ page }) => {
    // Navigate to dossiers and open a dossier
    await navigateToDossiers(page);

    const timestamp = new Date().getTime();
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();
      await ensureDossierExists(page, 'Test Initial State ' + timestamp, '+3362349' + timestamp.toString().slice(-4));
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    // Switch to Consentements tab
    await switchToTab(page, 'Consentements');
    await page.waitForSelector('.consent-cards-grid', { timeout: 10000 });

    // Verify at least 2 consent cards exist
    const consentCards = page.locator('.consent-card');
    const cardCount = await consentCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Verify SMS card exists and has initial state
    const smsCard = consentCards.filter({ hasText: 'SMS' });
    await expect(smsCard).toBeVisible();

    const smsCardBody = smsCard.locator('.consent-card-body');
    const smsHasStatus = await smsCardBody.locator('.consent-current-status').count() > 0;
    const smsNoStatus = await smsCardBody.locator('.consent-no-status').count() > 0;
    expect(smsHasStatus || smsNoStatus).toBeTruthy();

    // Verify all three buttons are present
    await expect(smsCard.locator('button.consent-btn-granted')).toBeVisible();
    await expect(smsCard.locator('button.consent-btn-denied')).toBeVisible();
    await expect(smsCard.locator('button.consent-btn-revoked')).toBeVisible();

    // Verify EMAIL card exists and has initial state
    const emailCard = consentCards.filter({ hasText: 'Email' });
    await expect(emailCard).toBeVisible();

    const emailCardBody = emailCard.locator('.consent-card-body');
    const emailHasStatus = await emailCardBody.locator('.consent-current-status').count() > 0;
    const emailNoStatus = await emailCardBody.locator('.consent-no-status').count() > 0;
    expect(emailHasStatus || emailNoStatus).toBeTruthy();

    // Verify all three buttons are present
    await expect(emailCard.locator('button.consent-btn-granted')).toBeVisible();
    await expect(emailCard.locator('button.consent-btn-denied')).toBeVisible();
    await expect(emailCard.locator('button.consent-btn-revoked')).toBeVisible();

    // Verify history accordion is present
    const historyAccordion = page.locator('.consent-history-section');
    await expect(historyAccordion).toBeVisible();
  });
});
