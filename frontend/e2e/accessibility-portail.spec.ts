import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Portail public et vitrine : aucune violation WCAG 2.1 A/AA, contraste compris.
 * Les autres specs d'accessibilité ne bloquent que les violations « critical » ; le contraste
 * (« serious ») y passait inaperçu.
 */
const PAGES = [
  { name: 'accueil du portail', path: '/' },
  { name: 'recherche', path: '/recherche' },
  { name: 'vitrine pro', path: '/biz' },
  { name: 'contact', path: '/biz/contact' },
  { name: 'connexion', path: '/login' },
];

test.describe('Portail public — WCAG 2.1 AA @a11y', () => {
  for (const p of PAGES) {
    test(`${p.name} (${p.path}) sans violation`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const summary = results.violations.map(
        v => `${v.id} (${v.impact}) × ${v.nodes.length} : ${v.nodes[0]?.target.join(' ')}`
      );
      expect(summary, summary.join('\n')).toEqual([]);
    });
  }

  test('le lien « Passer au contenu » reste sur la page et donne le focus au contenu', async ({ page }) => {
    await page.goto('/recherche');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Passer au contenu principal' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/recherche/);
    await expect(page.locator('#pub-main')).toBeFocused();
  });
});
