import { test, expect } from './stable-test-fixture';
import { AxeHelper } from './axe-helper';

test.describe('Dossier Accessibility Tests @a11y', () => {
  test('Dossier list page should have no critical accessibility violations', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToDossiers();
    await page.waitForLoadState('networkidle');

    const results = await axe.scanForViolations('dossier-list-page');

    await axe.assertNoCriticalViolations('dossier-list-page');

    expect(results.violations.filter((v) => v.impact === 'critical').length).toBe(0);
    expect(results.violations.filter((v) => v.impact === 'serious').length).toBe(0);
  });

  test('Dossier creation dialog should be accessible', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToDossiers();
    await helpers.clickButton('button:has-text("Nouveau"), button:has-text("Créer")');
    await helpers.waitForDialog();

    const results = await axe.scanForViolations('dossier-creation-dialog');

    await axe.assertNoCriticalViolations('dossier-creation-dialog');

    const formFields = page.locator('input, select, textarea');
    const formFieldsCount = await formFields.count();

    for (let i = 0; i < formFieldsCount; i++) {
      const field = formFields.nth(i);
      const hasLabel = await field.evaluate((el) => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const hasAssociatedLabel = id ? document.querySelector(`label[for="${id}"]`) !== null : false;
        return hasAssociatedLabel || ariaLabel || ariaLabelledBy;
      });

      expect(hasLabel).toBeTruthy();
    }
  });

  test('Dossier detail page with tabs should be keyboard navigable', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `A11y Test Lead ${timestamp}`,
      `+336123${timestamp.toString().slice(-4)}`
    );

    cleanup.trackDossier(dossierId);

    await page.waitForLoadState('networkidle');

    const results = await axe.scanForViolations('dossier-detail-page');

    await axe.assertNoCriticalViolations('dossier-detail-page');

    const tabs = page.locator('[role="tab"], mat-tab-label, .mat-tab-label');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        const tab = tabs.nth(i);
        await tab.focus();
        
        const isFocusable = await tab.evaluate((el) => {
          const tabIndex = el.getAttribute('tabindex');
          return tabIndex === '0' || tabIndex === null;
        });

        expect(isFocusable).toBeTruthy();
      }
    }
  });

  test('Message creation form should have proper ARIA labels', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `A11y Message Test ${timestamp}`,
      `+336456${timestamp.toString().slice(-4)}`
    );

    cleanup.trackDossier(dossierId);

    await helpers.switchToTab('Messages');
    await helpers.clickButton('button:has-text("Nouveau message")');
    await helpers.waitForDialog();

    const results = await axe.scanForViolations('message-creation-form');

    await axe.assertNoCriticalViolations('message-creation-form');

    const requiredFields = page.locator('[required], [aria-required="true"]');
    const requiredCount = await requiredFields.count();

    for (let i = 0; i < requiredCount; i++) {
      const field = requiredFields.nth(i);
      const hasAriaRequired = await field.getAttribute('aria-required');
      const isRequired = await field.getAttribute('required');

      expect(hasAriaRequired === 'true' || isRequired !== null).toBeTruthy();
    }
  });

  test('Appointment scheduling form should meet color contrast requirements', async ({
    authenticatedPage: page,
    helpers,
    cleanup,
  }) => {
    const axe = new AxeHelper(page);

    await helpers.navigateToDossiers();

    const timestamp = Date.now();
    const dossierId = await helpers.ensureDossierExists(
      `A11y Appointment Test ${timestamp}`,
      `+336789${timestamp.toString().slice(-4)}`
    );

    cleanup.trackDossier(dossierId);

    await helpers.switchToTab('Rendez-vous');
    await helpers.clickButton('button:has-text("Planifier")');
    await helpers.waitForDialog();

    const results = await axe.scanForViolations('appointment-scheduling-form', null, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    const colorContrastViolations = results.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(colorContrastViolations.length).toBe(0);
  });
});
