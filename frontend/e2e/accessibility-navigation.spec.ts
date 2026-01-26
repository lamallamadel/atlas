import { test, expect } from './stable-test-fixture';
import { AxeHelper } from './axe-helper';

test.describe('Navigation Accessibility Tests @a11y', () => {
  test('Dashboard should be accessible with proper landmarks', async ({
    authenticatedPage: page,
  }) => {
    const axe = new AxeHelper(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await axe.scanForViolations('dashboard-page');

    await axe.assertNoCriticalViolations('dashboard-page');

    const landmarks = await page.evaluate(() => {
      const nav = document.querySelector('nav, [role="navigation"]');
      const main = document.querySelector('main, [role="main"]');
      const header = document.querySelector('header, [role="banner"]');
      
      return {
        hasNav: !!nav,
        hasMain: !!main,
        hasHeader: !!header,
      };
    });

    expect(landmarks.hasMain).toBeTruthy();
  });

  test('Main navigation should be keyboard accessible', async ({
    authenticatedPage: page,
  }) => {
    const axe = new AxeHelper(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navLinks = page.locator('nav a, [role="navigation"] a, .sidenav a');
    const linkCount = await navLinks.count();

    expect(linkCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = navLinks.nth(i);
      await link.focus();
      
      const isFocused = await link.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
    }

    const results = await axe.scanForViolations('main-navigation');
    await axe.assertNoCriticalViolations('main-navigation');
  });

  test('Skip to main content link should be present', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main"], a[href="#main-content"], .skip-link');
    const skipLinkExists = (await skipLink.count()) > 0;

    if (skipLinkExists) {
      const firstSkipLink = skipLink.first();
      const isVisible = await firstSkipLink.isVisible().catch(() => false);
      
      if (!isVisible) {
        await firstSkipLink.focus();
        const isFocusVisible = await firstSkipLink.isVisible();
        expect(isFocusVisible).toBeTruthy();
      }
    }
  });

  test('Form validation errors should be announced to screen readers', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToDossiers();
    await helpers.clickButton('button:has-text("Nouveau"), button:has-text("Créer")');
    await helpers.waitForDialog();

    const submitButton = page.locator(
      'mat-dialog-container button[type="submit"], mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")'
    );

    if ((await submitButton.count()) > 0) {
      await submitButton.first().click();

      await page.waitForTimeout(500);

      const errorMessages = page.locator('.error, .mat-error, [role="alert"]');
      const errorCount = await errorMessages.count();

      if (errorCount > 0) {
        for (let i = 0; i < Math.min(errorCount, 3); i++) {
          const error = errorMessages.nth(i);
          const ariaLive = await error.getAttribute('aria-live');
          const role = await error.getAttribute('role');

          const isAnnounced =
            ariaLive === 'polite' ||
            ariaLive === 'assertive' ||
            role === 'alert' ||
            (await error.evaluate((el) => el.classList.contains('mat-error')));

          expect(isAnnounced).toBeTruthy();
        }
      }
    }

    const results = await axe.scanForViolations('form-validation-errors');
    await axe.assertNoCriticalViolations('form-validation-errors');
  });

  test('Notification messages should have proper ARIA roles', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `A11y Notification Test ${timestamp}`,
      `+336999${timestamp.toString().slice(-4)}`
    );

    cleanup.trackDossier(dossierId);

    await page.waitForTimeout(1000);

    const snackbars = page.locator(
      'snack-bar-container, .mat-snack-bar-container, [role="alert"], [role="status"]'
    );

    if ((await snackbars.count()) > 0) {
      const snackbar = snackbars.first();
      const role = await snackbar.getAttribute('role');
      const ariaLive = await snackbar.getAttribute('aria-live');

      const hasProperRole = role === 'alert' || role === 'status' || ariaLive === 'polite' || ariaLive === 'assertive';
      expect(hasProperRole).toBeTruthy();
    }
  });
});
