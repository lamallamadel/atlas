import { test, expect } from './stable-test-fixture';
import { AxeHelper } from './axe-helper';

test.describe('Annonce Accessibility Tests @a11y', () => {
  test('Annonce list page should have no critical accessibility violations', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToAnnonces();
    await page.waitForLoadState('networkidle');

    const results = await axe.scanForViolations('annonce-list-page');

    await axe.assertNoCriticalViolations('annonce-list-page');

    expect(results.violations.filter((v) => v.impact === 'critical').length).toBe(0);
    expect(results.violations.filter((v) => v.impact === 'serious').length).toBe(0);
  });

  test('Annonce creation wizard should be accessible', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToAnnonces();
    
    const createButton = page.locator('button:has-text("Nouvelle annonce"), button:has-text("Créer")');
    
    if ((await createButton.count()) > 0) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      const results = await axe.scanForViolations('annonce-creation-wizard');

      await axe.assertNoCriticalViolations('annonce-creation-wizard');

      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 10); i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.evaluate((el) => {
          const id = el.getAttribute('id');
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const hasAssociatedLabel = id ? document.querySelector(`label[for="${id}"]`) !== null : false;
          const placeholder = el.getAttribute('placeholder');
          
          return hasAssociatedLabel || ariaLabel || ariaLabelledBy || (placeholder && placeholder.length > 0);
        });

        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('Image upload controls should have alt text requirements', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToAnnonces();
    
    const createButton = page.locator('button:has-text("Nouvelle annonce"), button:has-text("Créer")');
    
    if ((await createButton.count()) > 0) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      const photoSection = page.locator('[data-testid="photo-upload"], .photo-upload, button:has-text("Ajouter")');
      
      if ((await photoSection.count()) > 0) {
        const results = await axe.scanForViolations('annonce-photo-upload');

        const imageViolations = results.violations.filter(
          (v) => v.id === 'image-alt' || v.id === 'image-redundant-alt'
        );

        expect(imageViolations.length).toBe(0);
      }
    }
  });

  test('Annonce filters should be keyboard navigable', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToAnnonces();
    await page.waitForLoadState('networkidle');

    const filterControls = page.locator('select, input[type="search"], button[aria-label*="filtre"]');
    const filterCount = await filterControls.count();

    if (filterCount > 0) {
      for (let i = 0; i < Math.min(filterCount, 3); i++) {
        const control = filterControls.nth(i);
        await control.focus();
        
        const isFocused = await control.evaluate((el) => document.activeElement === el);
        expect(isFocused).toBeTruthy();
      }

      const results = await axe.scanForViolations('annonce-filters');
      await axe.assertNoCriticalViolations('annonce-filters');
    }
  });

  test('Annonce detail view should meet WCAG standards', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToAnnonces();
    await page.waitForLoadState('networkidle');

    const annonceCards = page.locator('.annonce-card, .property-card, table tbody tr a');
    
    if ((await annonceCards.count()) > 0) {
      await annonceCards.first().click();
      await page.waitForLoadState('networkidle');

      const results = await axe.scanForViolations('annonce-detail-view', null, {
        rules: {
          'color-contrast': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-one-main': { enabled: true },
        },
      });

      await axe.assertNoCriticalViolations('annonce-detail-view');

      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      if (headingCount > 0) {
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
        expect(h1Count).toBeLessThanOrEqual(1);
      }
    }
  });
});
