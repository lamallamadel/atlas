import { Page } from '@playwright/test';

/**
 * Navigate to dossiers list page
 */
export async function navigateToDossiers(page: Page): Promise<void> {
  const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
  await dossiersLink.first().click();
  await page.waitForURL(/.*dossiers/, { timeout: 10000 });
  await page.waitForSelector('table.data-table, .dossier-card, .empty-message', { timeout: 15000 });
}

/**
 * Create a new dossier if needed
 */
export async function ensureDossierExists(page: Page, leadName: string, leadPhone: string): Promise<void> {
  const dossierLink = page.locator('table.data-table tbody tr').first();
  const hasDossiers = await dossierLink.count() > 0;

  if (!hasDossiers) {
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    await createButton.first().click();
    
    await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
    await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
    await submitButton.click();
    
    await page.waitForTimeout(2000);
  } else {
    await dossierLink.click();
  }
}

/**
 * Switch to a specific tab in the dossier detail page
 */
export async function switchToTab(page: Page, tabName: string): Promise<void> {
  const tab = page.locator(`div.mat-mdc-tab-label-content:has-text("${tabName}"), .mat-tab-label:has-text("${tabName}")`);
  await tab.click();
  await page.waitForTimeout(1000);
}

/**
 * Format date for datetime-local input
 */
export function formatDateTimeLocal(date: Date): string {
  return date.toISOString().substring(0, 16);
}

/**
 * Get dossier ID from current URL
 */
export function extractDossierId(url: string): string | null {
  const match = url.match(/dossiers\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Wait for dialog to open
 */
export async function waitForDialog(page: Page): Promise<void> {
  await page.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });
}

/**
 * Close snackbar notifications
 */
export async function closeSnackbar(page: Page): Promise<void> {
  const snackbar = page.locator('.mat-mdc-snack-bar-container, .snackbar');
  const isVisible = await snackbar.isVisible().catch(() => false);
  
  if (isVisible) {
    const closeButton = snackbar.locator('button');
    const hasCloseButton = await closeButton.count() > 0;
    
    if (hasCloseButton) {
      await closeButton.click();
    } else {
      await page.waitForTimeout(3500);
    }
  }
}
