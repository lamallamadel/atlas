import { expect, Route } from '@playwright/test';
import { test } from '@playwright/test';
import { loginWithMockToken, logout } from './auth.fixture';
import { AnnoncesListPage, AnnonceCreatePage, AnnonceDetailPage } from './pages/annonces.page';
import { closeSnackbar } from './helpers';

test.describe('Multi-tenant E2E Tests', () => {
  test('Complete multi-tenant workflow: ORG-001 creates annonce → intercept API with X-Org-Id → ORG-002 cannot see it → 404 on direct URL', async ({ page }) => {
    const timestamp = Date.now();
    const annonceTitle = `E2E Test Annonce ${timestamp}`;
    let createdAnnonceId: string | null = null;
    let interceptedOrgId: string | null = null;

    // Step 1: Login with ORG-001 token
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginWithMockToken(page, 'ORG-001');
    await page.waitForTimeout(1000);

    // Navigate to annonces list
    const annoncesListPage = new AnnoncesListPage(page);
    await annoncesListPage.goto();
    await page.waitForTimeout(1000);

    // Step 2: Create annonce as ORG-001
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouvelle annonce"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();
      await page.waitForURL(/.*annonces\/new/, { timeout: 5000 });

      // Fill Step 1: Basic information
      const annonceCreatePage = new AnnonceCreatePage(page);
      await annonceCreatePage.fillStep1(
        annonceTitle,
        'APARTMENT',
        'SALE',
        'Test description for multi-tenant E2E'
      );

      // Move to Step 2
      await annonceCreatePage.goToNextStep();

      // Fill Step 2: Price and location
      await annonceCreatePage.fillStep2(250000, 'Paris');

      // Move to Step 3 (photos - skip)
      await annonceCreatePage.goToNextStep();

      // Move to Step 4 (rules - skip)
      await annonceCreatePage.goToNextStep();

      // Step 3: Intercept API request to verify X-Org-Id header
      let headerIntercepted = false;
      await page.route('**/api/v1/annonces', async (route: Route) => {
        const headers = route.request().headers();
        interceptedOrgId = headers['x-org-id'] || headers['X-Org-Id'];
        headerIntercepted = true;
        await route.continue();
      });

      // Submit the form
      await annonceCreatePage.submitForm();

      // Wait for redirect to annonces list
      await page.waitForURL(/.*\/annonces$/, { timeout: 10000 });
      await closeSnackbar(page);

      // Verify header was intercepted
      expect(headerIntercepted, 'API request should have been intercepted').toBeTruthy();
      expect(interceptedOrgId, 'X-Org-Id header should be present').toBe('ORG-001');

      // Find the created annonce in the list
      await page.waitForTimeout(1500);
      const annonceRow = page.locator('table.data-table tbody tr').filter({ hasText: annonceTitle });
      await expect(annonceRow.first()).toBeVisible({ timeout: 10000 });

      // Click on the annonce to get its ID
      await annonceRow.first().click();
      await page.waitForURL(/.*annonces\/\d+/, { timeout: 5000 });

      const url = page.url();
      const match = url.match(/annonces\/(\d+)/);
      createdAnnonceId = match ? match[1] : null;
      expect(createdAnnonceId, 'Should have created annonce ID').toBeTruthy();

      // Navigate back to list
      await page.goBack();
      await page.waitForURL(/.*\/annonces$/, { timeout: 5000 });
    } else {
      // If we can't create, try to find an existing annonce for ORG-001
      const firstRow = page.locator('table.data-table tbody tr').first();
      const hasAnnonces = await firstRow.count() > 0;

      if (hasAnnonces) {
        await firstRow.click();
        await page.waitForURL(/.*annonces\/\d+/, { timeout: 5000 });

        const url = page.url();
        const match = url.match(/annonces\/(\d+)/);
        createdAnnonceId = match ? match[1] : null;

        await page.goBack();
      } else {
        throw new Error('No annonces available for ORG-001 and cannot create new one');
      }
    }

    expect(createdAnnonceId, 'Must have an annonce ID for testing').toBeTruthy();

    // Step 4: Logout from ORG-001
    await logout(page);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Step 5: Login with ORG-002 token
    await loginWithMockToken(page, 'ORG-002');
    await page.waitForTimeout(1000);

    // Navigate to annonces list
    await annoncesListPage.goto();
    await page.waitForTimeout(1000);

    // Step 6: Verify ORG-001 annonce is NOT in the list for ORG-002
    const annoncesInList = await annoncesListPage.hasAnnonceWithTitle(annonceTitle);
    expect(annoncesInList, 'ORG-001 annonce should NOT be visible in ORG-002 list').toBe(false);

    // Alternative check: search for the annonce by title
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"], input.search-input');
    const hasSearchInput = await searchInput.count() > 0;

    if (hasSearchInput) {
      await searchInput.fill(annonceTitle);
      await page.waitForTimeout(1000);

      const searchResultRow = page.locator('table.data-table tbody tr').filter({ hasText: annonceTitle });
      const searchResultCount = await searchResultRow.count();
      expect(searchResultCount, 'ORG-001 annonce should NOT appear in search results for ORG-002').toBe(0);
    }

    // Step 7: Setup interception to capture API response status BEFORE navigating
    let apiStatusCode: number | null = null;

    await page.route(`**/api/v1/annonces/${createdAnnonceId}`, async (route: Route) => {
      const response = await route.fetch();
      apiStatusCode = response.status();
      
      await route.fulfill({ response });
    });

    // Step 8: Attempt direct URL navigation to ORG-001 annonce
    await page.goto(`/annonces/${createdAnnonceId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Step 9: Verify backend returned 404 not 403 (anti-enumeration)
    expect(apiStatusCode, 'API should return 404 status code (not 403) for anti-enumeration').toBe(404);

    // Step 10: Verify 404 error page is displayed
    const annonceDetailPage = new AnnonceDetailPage(page);
    const isErrorDisplayed = await annonceDetailPage.isErrorDisplayed();
    expect(isErrorDisplayed, '404 error message should be displayed').toBe(true);

    // Step 11: Verify error message contains "introuvable" (not found)
    const errorText = await annonceDetailPage.getErrorText();
    expect(errorText.toLowerCase(), 'Error message should indicate resource not found').toContain('introuvable');

    // Step 12: Verify no content is displayed (the annonce details should not be shown)
    const hasDetailContent = await annonceDetailPage.detailContent.isVisible().catch(() => false);
    expect(hasDetailContent, 'Annonce detail content should NOT be visible').toBe(false);

    // Cleanup: logout from ORG-002
    await logout(page);
  });

  test('Verify X-Org-Id header is sent with every API request', async ({ page }) => {
    const interceptedHeaders: string[] = [];

    // Login with ORG-001
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginWithMockToken(page, 'ORG-001');
    await page.waitForTimeout(1000);

    // Intercept all API requests
    await page.route('**/api/**', async (route: Route) => {
      const headers = route.request().headers();
      const orgId = headers['x-org-id'] || headers['X-Org-Id'];
      if (orgId) {
        interceptedHeaders.push(orgId);
      }
      await route.continue();
    });

    // Navigate to annonces list (triggers API call)
    const annoncesListPage = new AnnoncesListPage(page);
    await annoncesListPage.goto();
    await page.waitForTimeout(1500);

    // Verify at least one API call was made with X-Org-Id header
    expect(interceptedHeaders.length, 'At least one API call should have X-Org-Id header').toBeGreaterThan(0);

    // Verify all intercepted headers have ORG-001
    interceptedHeaders.forEach(orgId => {
      expect(orgId, 'All API requests should have X-Org-Id=ORG-001').toBe('ORG-001');
    });

    // Navigate to dashboard (triggers more API calls)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Verify more headers were captured
    const headersAfterDashboard = interceptedHeaders.length;
    expect(headersAfterDashboard, 'Dashboard should trigger additional API calls').toBeGreaterThan(1);

    await logout(page);
  });

  test('Verify tenant isolation: Create annonce in ORG-003 → Switch to ORG-004 → Verify not visible', async ({ page }) => {
    const timestamp = Date.now();
    const org3AnnonceTitle = `ORG-003 Annonce ${timestamp}`;

    // Login with ORG-003
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginWithMockToken(page, 'ORG-003');
    await page.waitForTimeout(1000);

    // Navigate to annonces
    const annoncesListPage = new AnnoncesListPage(page);
    await annoncesListPage.goto();

    // Create annonce for ORG-003
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouvelle annonce"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();
      await page.waitForURL(/.*annonces\/new/, { timeout: 5000 });

      const annonceCreatePage = new AnnonceCreatePage(page);
      await annonceCreatePage.fillStep1(org3AnnonceTitle, 'HOUSE', 'RENT', 'ORG-003 exclusive');
      await annonceCreatePage.goToNextStep();
      await annonceCreatePage.fillStep2(1500, 'Lyon');
      await annonceCreatePage.goToNextStep();
      await annonceCreatePage.goToNextStep();
      await annonceCreatePage.submitForm();

      await page.waitForURL(/.*\/annonces$/, { timeout: 10000 });
      await closeSnackbar(page);
      await page.waitForTimeout(1000);

      // Verify annonce exists for ORG-003
      const hasAnnonce = await annoncesListPage.hasAnnonceWithTitle(org3AnnonceTitle);
      expect(hasAnnonce, 'Created annonce should be visible for ORG-003').toBe(true);
    }

    // Logout from ORG-003
    await logout(page);

    // Login with ORG-004
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginWithMockToken(page, 'ORG-004');
    await page.waitForTimeout(1000);

    // Navigate to annonces list
    await annoncesListPage.goto();
    await page.waitForTimeout(1000);

    // Verify ORG-003 annonce is NOT visible
    const hasAnnonce = await annoncesListPage.hasAnnonceWithTitle(org3AnnonceTitle);
    expect(hasAnnonce, 'ORG-003 annonce should NOT be visible for ORG-004').toBe(false);

    // Verify with search if available
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"]');
    const hasSearchInput = await searchInput.count() > 0;

    if (hasSearchInput) {
      await searchInput.fill(org3AnnonceTitle);
      await page.waitForTimeout(1000);

      const searchResult = page.locator('table.data-table tbody tr').filter({ hasText: org3AnnonceTitle });
      const resultCount = await searchResult.count();
      expect(resultCount, 'Search should not return ORG-003 annonce for ORG-004').toBe(0);
    }

    await logout(page);
  });
});
