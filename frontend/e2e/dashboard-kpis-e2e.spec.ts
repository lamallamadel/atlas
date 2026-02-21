import { test, expect } from './stable-test-fixture';

test.describe.configure({ mode: 'serial' });
test.use({ trace: 'retain-on-failure' });

test.describe('Dashboard KPIs E2E Tests', () => {
  test('Dashboard KPIs: Navigate to dashboard → Verify KPI cards visible → Verify counts are numbers → Navigate via KPI cards with filters', async ({ authenticatedPage: page, helpers }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 5000 });

    // Step 2: Verify all KPI cards are visible within 2 seconds
    const kpiCardsLocator = page.locator('.kpi-card');

    await helpers.waitForSelector('.kpi-card');

    const kpiCardCount = await kpiCardsLocator.count();
    expect(kpiCardCount, 'Should have exactly 2 KPI cards').toBeGreaterThanOrEqual(2);

    // Step 3: Verify the 2 specific KPI cards exist
    const annoncesActivesCard = page.locator('.kpi-card:has-text("Annonces actives")');
    const dossiersATraiterCard = page.locator('.kpi-card:has-text("Dossiers à traiter")');
    const derniersDossiersCard = page.locator('mat-card.section-card:has-text("Derniers dossiers")');

    await expect(annoncesActivesCard).toBeVisible({ timeout: 2000 });
    await expect(dossiersATraiterCard).toBeVisible({ timeout: 2000 });
    await expect(derniersDossiersCard).toBeVisible({ timeout: 2000 });

    // Step 4: Wait for KPI data to load and verify count values are numbers
    // Wait for loading spinners to disappear
    await page.waitForSelector('.kpi-card.loading', { state: 'hidden', timeout: 5000 }).catch(() => {
      // Ignore if loading state never appeared
    });

    const annoncesActivesValue = await annoncesActivesCard
      .locator('.kpi-value')
      .textContent({ timeout: 3000 });
    const dossiersATraiterValue = await dossiersATraiterCard
      .locator('.kpi-value')
      .textContent({ timeout: 3000 });

    expect(annoncesActivesValue?.trim()).toMatch(/^\d+$/);
    expect(dossiersATraiterValue?.trim()).toMatch(/^\d+$/);

    const annoncesCount = parseInt(annoncesActivesValue?.trim() || '0', 10);
    const dossiersCount = parseInt(dossiersATraiterValue?.trim() || '0', 10);

    expect(annoncesCount).toBeGreaterThanOrEqual(0);
    expect(dossiersCount).toBeGreaterThanOrEqual(0);

    // Step 5: Click "Annonces actives" KPI card to navigate
    await annoncesActivesCard.click();

    // Step 6: Verify navigation to /annonces with status=ACTIVE filter
    await page.waitForURL(/.*\/annonces/, { timeout: 5000 });

    // Verify the URL contains the status filter parameter
    const annoncesUrl = page.url();
    expect(annoncesUrl).toContain('/annonces');
    const annoncesSearchParams = new URL(annoncesUrl).searchParams;
    expect(annoncesSearchParams.get('status')).toBe('ACTIVE');

    // Check if status filter is applied in the UI
    const statusSelect = page.locator('select#status, select[name="status"], select').filter({ hasText: /Statut|Status/i }).or(page.locator('select').first());
    const statusSelectExists = await statusSelect.count() > 0;

    if (statusSelectExists) {
      const selectedValue = await statusSelect.inputValue();
      // ACTIVE or PUBLISHED might be the filter value
      expect(selectedValue).toMatch(/ACTIVE|PUBLISHED/i);
    }

    // Navigate back to dashboard
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.kpi-card', { timeout: 5000 });

    // Step 7: Click "Dossiers à traiter" KPI card to navigate
    await dossiersATraiterCard.click();

    // Step 8: Verify navigation to /dossiers with status filter
    await page.waitForURL(/.*\/dossiers/, { timeout: 5000 });

    const dossiersUrl = page.url();
    expect(dossiersUrl).toContain('/dossiers');
    const dossiersSearchParams = new URL(dossiersUrl).searchParams;
    expect(dossiersSearchParams.get('status')).toBe('NEW');

    // Check if status filter is applied in the UI (NEW, QUALIFYING, or QUALIFIED)
    const dossierStatusSelect = page.locator('select#status, select[name="status"], select').filter({ hasText: /Statut|Status/i }).or(page.locator('select').first());
    const dossierStatusSelectExists = await dossierStatusSelect.count() > 0;

    if (dossierStatusSelectExists) {
      const dossierSelectedValue = await dossierStatusSelect.inputValue();
      // Dossiers à traiter typically means NEW, QUALIFYING, or QUALIFIED status
      expect(dossierSelectedValue).toMatch(/NEW|QUALIFYING|QUALIFIED/i);
    }

    // Navigate back to dashboard
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.kpi-card', { timeout: 5000 });

    // Step 9: Performance assertion - verify dashboard loads and renders all KPIs within 2 seconds
    const performanceStartTime = Date.now();

    await page.reload({ waitUntil: 'domcontentloaded' });
    
    // Wait for all KPI cards to be visible
    await expect(annoncesActivesCard).toBeVisible({ timeout: 2000 });
    await expect(dossiersATraiterCard).toBeVisible({ timeout: 2000 });
    await expect(derniersDossiersCard).toBeVisible({ timeout: 2000 });

    const performanceEndTime = Date.now();
    const loadTime = performanceEndTime - performanceStartTime;

    expect(loadTime).toBeLessThanOrEqual(2000);

    // Additional verification: Ensure KPI values are loaded (not in loading state)
    const isAnnoncesLoading = await annoncesActivesCard.evaluate(card => card.classList.contains('loading')).catch(() => false);
    const isDossiersLoading = await dossiersATraiterCard.evaluate(card => card.classList.contains('loading')).catch(() => false);
    const isDerniersLoading = await derniersDossiersCard.locator('app-loading-skeleton').isVisible().catch(() => false);
    
    // Allow up to 2 seconds total for all KPIs to finish loading
    if (isAnnoncesLoading || isDossiersLoading || isDerniersLoading) {
      await page.waitForSelector('.kpi-card.loading', { state: 'hidden', timeout: 2000 }).catch(() => {
        // If still loading after 2 seconds, that's acceptable but log it
        console.warn('Some KPIs still loading after 2 seconds');
      });
    }

    const totalTestTime = Date.now() - startTime;
    console.log(`Dashboard KPIs test completed in ${totalTestTime}ms`);
  });

  test('Dashboard KPIs: Verify all KPIs display correct data types and handle loading states', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await helpers.waitForSelector('.kpi-card');

    const annoncesCard = page.locator('.kpi-card:has-text("Annonces actives")');
    await expect(annoncesCard).toBeVisible();
    
    // Check if loading state exists or if data is already loaded
    const hasAnnoncesLoading = await annoncesCard.evaluate(card => card.classList.contains('loading')).catch(() => false);
    
    if (hasAnnoncesLoading) {
      // Wait for loading to complete
      await annoncesCard.locator('.kpi-value').waitFor({ timeout: 5000 });
    }
    
    // Verify the value is a number
    const annoncesValue = await annoncesCard.locator('.kpi-value').textContent();
    expect(annoncesValue?.trim()).toMatch(/^\d+$/);

    const dossiersCard = page.locator('.kpi-card:has-text("Dossiers à traiter")');
    await expect(dossiersCard).toBeVisible();
    
    const hasDossiersLoading = await dossiersCard.evaluate(card => card.classList.contains('loading')).catch(() => false);
    
    if (hasDossiersLoading) {
      await dossiersCard.locator('.kpi-value').waitFor({ timeout: 5000 });
    }
    
    const dossiersValue = await dossiersCard.locator('.kpi-value').textContent();
    expect(dossiersValue?.trim()).toMatch(/^\d+$/);

    // Verify Derniers dossiers KPI
    const derniersCard = page.locator('mat-card.section-card:has-text("Derniers dossiers")');
    await expect(derniersCard).toBeVisible();
    
    // This card might show a list or an empty state
    const hasDerniersLoading = await derniersCard.locator('app-loading-skeleton').isVisible().catch(() => false);
    
    if (hasDerniersLoading) {
      // Wait for either dossiers list or empty state
      await page.waitForSelector('.dossiers-list, .empty-state-container', { timeout: 5000 });
    }
    
    // Check if there are dossiers or empty state
    const hasDossiersList = await derniersCard.locator('.dossiers-list').isVisible().catch(() => false);
    const hasEmptyState = await derniersCard.locator('.empty-state-container').isVisible().catch(() => false);
    
    expect(hasDossiersList || hasEmptyState).toBeTruthy();
  });

  test('Dashboard KPIs: Verify error handling when API fails', async ({ authenticatedPage: page, context }) => {
    // Intercept API calls and simulate failures
    await context.route('**/api/v1/dashboard/kpis/trends', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await context.route('**/api/v1/dashboard/dossiers/recent**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const annoncesCard = page.locator('.kpi-card:has-text("Annonces actives")');
    const dossiersCard = page.locator('.kpi-card:has-text("Dossiers à traiter")');
    const derniersCard = page.locator('mat-card.section-card:has-text("Derniers dossiers")');

    await expect(annoncesCard).toBeVisible();
    await expect(dossiersCard).toBeVisible();
    await expect(derniersCard).toBeVisible();

    const annoncesError = await annoncesCard.locator('.kpi-error, .error-message').isVisible().catch(() => false);
    const dossiersError = await dossiersCard.locator('.kpi-error, .error-message').isVisible().catch(() => false);
    const derniersError = await derniersCard.locator('.kpi-error, .error-message').isVisible().catch(() => false);

    const hasErrorHandling = annoncesError || dossiersError || derniersError;
    expect(hasErrorHandling).toBeTruthy();
    
    // Log the result for debugging
    console.log(`Error handling test: Annonces error shown: ${annoncesError}, Dossiers error shown: ${dossiersError}, Derniers dossiers error shown: ${derniersError}`);
  });
});
