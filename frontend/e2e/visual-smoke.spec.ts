import { test, expect } from './auth.fixture';
import type { Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUTPUT_DIR = path.join('test-results', 'visual-smoke');

async function capture(page: Page, name: string): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
}

test.describe('Visual smoke pack @visual', () => {
  test('captures dashboard, dossiers, annonces, reports and settings', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/pro/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await capture(page, '01-dashboard');

    await page.goto('/pro/dossiers', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText(/dossier|dossiers/i);
    await capture(page, '02-dossiers');

    await page.goto('/pro/annonces', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText(/annonce|annonces/i);
    await capture(page, '03-annonces');

    await page.goto('/pro/reports', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText(/report|rapport/i);
    await capture(page, '04-reports');

    await page.goto('/pro/settings', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText(/settings|paramètres/i);
    await capture(page, '05-settings');
  });
});

