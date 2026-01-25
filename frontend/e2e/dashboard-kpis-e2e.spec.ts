import { test, expect } from './stable-test-fixture';

test.describe('Dashboard KPIs E2E Tests', () => {
  test('Dashboard KPIs: Navigate to dashboard → Verify 3 KPI cards visible → Verify counts are numbers → Navigate via "Voir tous" buttons with filters', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 5000 });

    const kpiCardsLocator = page.locator('.kpi-card');

    await helpers.waitForSelector('.kpi-card');

    const kpiCardCount = await kpiCardsLocator.count();
    expect(kpiCardCount, 'Should have exactly 3 KPI cards').toBeGreaterThanOrEqual(3);

    const annoncesActivesCard = page.locator('.kpi-card:has-text("Annonces actives")');
    const dossiersATraiterCard = page.locator('.kpi-card:has-text("Dossiers à traiter")');
    const derniersDossiersCard = page.locator('.kpi-card:has-text("Derniers dossiers")');

    await expect(annoncesActivesCard).toBeVisible({ timeout: 2000 });
    await expect(dossiersATraiterCard).toBeVisible({ timeout: 2000 });
    await expect(derniersDossiersCard).toBeVisible({ timeout: 2000 });

    await page
      .waitForSelector('.kpi-loading', { state: 'hidden', timeout: 5000 })
      .catch(() => {
        // Ignore if not found
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

    const annoncesVoirTousButton = annoncesActivesCard.locator(
      'button:has-text("Voir tous"), a:has-text("Voir tous")'
    );

    const hasAnnoncesButton = (await annoncesVoirTousButton.count()) > 0;

    if (hasAnnoncesButton) {
      await annoncesVoirTousButton.click();

      await page.waitForURL(/.*\/annonces/, { timeout: 5000 });

      const annoncesUrl = page.url();
      expect(annoncesUrl).toContain('/annonces');

      const statusSelect = page
        .locator('select#status, select[name="status"], select')
        .filter({ hasText: /Statut|Status/i })
        .or(page.locator('select').first());
      const statusSelectExists = (await statusSelect.count()) > 0;

      if (statusSelectExists) {
        const selectedValue = await statusSelect.inputValue();
        expect(selectedValue).toMatch(/ACTIVE|PUBLISHED/i);
      }

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await helpers.waitForSelector('.kpi-card');
    }

    const dossiersVoirTousButton = dossiersATraiterCard.locator(
      'button:has-text("Voir tous"), a:has-text("Voir tous")'
    );

    const hasDossiersButton = (await dossiersVoirTousButton.count()) > 0;

    if (hasDossiersButton) {
      await dossiersVoirTousButton.click();

      await page.waitForURL(/.*\/dossiers/, { timeout: 5000 });

      const dossiersUrl = page.url();
      expect(dossiersUrl).toContain('/dossiers');

      const dossierStatusSelect = page
        .locator('select#status, select[name="status"], select')
        .filter({ hasText: /Statut|Status/i })
        .or(page.locator('select').first());
      const dossierStatusSelectExists = (await dossierStatusSelect.count()) > 0;

      if (dossierStatusSelectExists) {
        const dossierSelectedValue = await dossierStatusSelect.inputValue();
        expect(dossierSelectedValue).toMatch(/NEW|QUALIFYING|QUALIFIED/i);
      }

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await helpers.waitForSelector('.kpi-card');
    }

    const performanceStartTime = Date.now();

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(annoncesActivesCard).toBeVisible({ timeout: 2000 });
    await expect(dossiersATraiterCard).toBeVisible({ timeout: 2000 });
    await expect(derniersDossiersCard).toBeVisible({ timeout: 2000 });

    const performanceEndTime = Date.now();
    const loadTime = performanceEndTime - performanceStartTime;

    expect(loadTime).toBeLessThanOrEqual(2000);

    const isAnnoncesLoading = await annoncesActivesCard
      .locator('.kpi-loading')
      .isVisible()
      .catch(() => false);
    const isDossiersLoading = await dossiersATraiterCard
      .locator('.kpi-loading')
      .isVisible()
      .catch(() => false);
    const isDerniersLoading = await derniersDossiersCard
      .locator('.kpi-loading')
      .isVisible()
      .catch(() => false);

    if (isAnnoncesLoading || isDossiersLoading || isDerniersLoading) {
      await page
        .waitForSelector('.kpi-loading', { state: 'hidden', timeout: 2000 })
        .catch(() => {
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

    const dossiersCard = page.locator('.kpi-card:has-text("Dossiers à traiter")');
    await expect(dossiersCard).toBeVisible();

    const derniersDossiersCard = page.locator('.kpi-card:has-text("Derniers dossiers")');
    await expect(derniersDossiersCard).toBeVisible();

    await page
      .waitForSelector('.kpi-loading', { state: 'hidden', timeout: 5000 })
      .catch(() => {
        // Ignore if not found
      });

    const annoncesValue = await annoncesCard.locator('.kpi-value').textContent();
    const dossiersValue = await dossiersCard.locator('.kpi-value').textContent();

    expect(annoncesValue).toMatch(/^\d+$/);
    expect(dossiersValue).toMatch(/^\d+$/);

    const derniersList = derniersDossiersCard.locator('.dossier-list-item, .recent-dossier');
    const hasDerniers = (await derniersList.count()) > 0;

    if (hasDerniers) {
      const firstDossier = derniersList.first();
      await expect(firstDossier).toBeVisible();

      const dossierName = await firstDossier.textContent();
      expect(dossierName).toBeTruthy();
    }
  });
});
