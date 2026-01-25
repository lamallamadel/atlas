import { test, expect } from './stable-test-fixture';

test.describe('Consentement Management E2E Tests', () => {
  test('Complete consent workflow: verify initial states → toggle SMS consent → verify EMAIL consent → verify history', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `Test Lead Consent ${timestamp}`,
      `+336234${timestamp.toString().slice(-4)}`
    );

    cleanup.trackDossier(dossierId);

    await helpers.closeSnackbar();

    await helpers.switchToTab('Consentements');

    await page
      .waitForSelector('.consent-cards-grid, .loading-state', { timeout: 10000 })
      .catch(() => {
        // Ignore if not found
      });

    const loadingState = page.locator('.loading-state');
    if (await loadingState.isVisible().catch(() => false)) {
      await helpers.waitForSelector('.consent-cards-grid');
    }

    const consentCards = page.locator('.consent-card');
    const consentCardsCount = await consentCards.count();
    expect(consentCardsCount).toBeGreaterThanOrEqual(2);

    const smsCard = consentCards.filter({ hasText: 'SMS' });
    await expect(smsCard).toBeVisible({ timeout: 5000 });

    const emailCard = consentCards.filter({ hasText: 'Email' });
    await expect(emailCard).toBeVisible({ timeout: 5000 });

    const smsCardBody = smsCard.locator('.consent-card-body');
    const smsHasConsent = (await smsCardBody.locator('.consent-current-status').count()) > 0;
    const smsNoConsent = (await smsCardBody.locator('.consent-no-status').count()) > 0;
    expect(smsHasConsent || smsNoConsent).toBeTruthy();

    const emailCardBody = emailCard.locator('.consent-card-body');
    const emailHasConsent = (await emailCardBody.locator('.consent-current-status').count()) > 0;
    const emailNoConsent = (await emailCardBody.locator('.consent-no-status').count()) > 0;
    expect(emailHasConsent || emailNoConsent).toBeTruthy();

    const smsGrantedButton = smsCard.locator('button.consent-btn-granted');

    const updateResponsePromise = helpers.waitForApiResponse(/\/api\/v1\/consentements/, {
      expectedStatus: 201,
      timeout: 5000,
    });

    await smsGrantedButton.click();

    await updateResponsePromise.catch(() => {
      // Ignore if not found
    });

    await helpers.closeSnackbar();

    const smsGrantedBadge = smsCard.locator('.consent-badge.consent-granted');
    await expect(smsGrantedBadge).toBeVisible({ timeout: 5000 });
    await expect(smsGrantedBadge).toContainText(/Accordé/i);

    const smsGrantedBadgeClass = await smsGrantedBadge.getAttribute('class');
    expect(smsGrantedBadgeClass).toContain('consent-granted');

    const smsGrantedButtonAfter = smsCard.locator('button.consent-btn-granted');
    await expect(smsGrantedButtonAfter).toBeDisabled();
    const smsGrantedButtonClass = await smsGrantedButtonAfter.getAttribute('class');
    expect(smsGrantedButtonClass).toContain('active');

    const smsRevokedButton = smsCard.locator('button.consent-btn-revoked');

    const revokeResponsePromise = helpers.waitForApiResponse(/\/api\/v1\/consentements/, {
      expectedStatus: 201,
      timeout: 5000,
    });

    await smsRevokedButton.click();

    await revokeResponsePromise.catch(() => {
      // Ignore if not found
    });

    await helpers.closeSnackbar();

    const smsRevokedBadge = smsCard.locator('.consent-badge.consent-revoked');
    await expect(smsRevokedBadge).toBeVisible({ timeout: 5000 });
    await expect(smsRevokedBadge).toContainText(/Révoqué/i);

    const smsRevokedBadgeClass = await smsRevokedBadge.getAttribute('class');
    expect(smsRevokedBadgeClass).toContain('consent-revoked');

    const smsRevokedButtonAfter = smsCard.locator('button.consent-btn-revoked');
    await expect(smsRevokedButtonAfter).toBeDisabled();
    const smsRevokedButtonClass = await smsRevokedButtonAfter.getAttribute('class');
    expect(smsRevokedButtonClass).toContain('active');

    const emailGrantedButton = emailCard.locator('button.consent-btn-granted');

    const emailGrantResponsePromise = helpers.waitForApiResponse(/\/api\/v1\/consentements/, {
      expectedStatus: 201,
      timeout: 5000,
    });

    await emailGrantedButton.click();

    await emailGrantResponsePromise.catch(() => {
      // Ignore if not found
    });

    await helpers.closeSnackbar();

    const emailGrantedBadge = emailCard.locator('.consent-badge.consent-granted');
    await expect(emailGrantedBadge).toBeVisible({ timeout: 5000 });
    await expect(emailGrantedBadge).toContainText(/Accordé/i);

    const emailGrantedBadgeClass = await emailGrantedBadge.getAttribute('class');
    expect(emailGrantedBadgeClass).toContain('consent-granted');

    const emailDeniedButton = emailCard.locator('button.consent-btn-denied');

    const emailDenyResponsePromise = helpers.waitForApiResponse(/\/api\/v1\/consentements/, {
      expectedStatus: 201,
      timeout: 5000,
    });

    await emailDeniedButton.click();

    await emailDenyResponsePromise.catch(() => {
      // Ignore if not found
    });

    await helpers.closeSnackbar();

    const emailDeniedBadge = emailCard.locator('.consent-badge.consent-denied');
    await expect(emailDeniedBadge).toBeVisible({ timeout: 5000 });
    await expect(emailDeniedBadge).toContainText(/Refusé/i);

    const emailDeniedBadgeClass = await emailDeniedBadge.getAttribute('class');
    expect(emailDeniedBadgeClass).toContain('consent-denied');

    const historyButton = page.locator('button:has-text("Historique des consentements")');
    const hasHistoryButton = (await historyButton.count()) > 0;

    if (hasHistoryButton) {
      await historyButton.click();

      await helpers.waitForDialog();

      const historyTable = page.locator('table.consent-history-table, mat-dialog-container table');
      await expect(historyTable).toBeVisible({ timeout: 5000 });

      const historyRows = historyTable.locator('tbody tr');
      const rowCount = await historyRows.count();

      expect(rowCount).toBeGreaterThan(0);

      await helpers.closeDialog();
    }
  });
});
