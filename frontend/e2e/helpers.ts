import { Page } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * Navigate to dossiers list page
 * @deprecated Use TestHelpers.navigateToDossiers() for better stability
 */
export async function navigateToDossiers(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.navigateToDossiers();
}

/**
 * Create a new dossier if needed
 * @deprecated Use TestHelpers.ensureDossierExists() for better stability
 */
export async function ensureDossierExists(page: Page, leadName: string, leadPhone: string): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.ensureDossierExists(leadName, leadPhone);
}

/**
 * Switch to a specific tab in the dossier detail page
 * @deprecated Use TestHelpers.switchToTab() for better stability
 */
export async function switchToTab(page: Page, tabName: string): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.switchToTab(tabName);
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
 * @deprecated Use TestHelpers.waitForDialog() for better stability
 */
export async function waitForDialog(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.waitForDialog();
}

/**
 * Close snackbar notifications
 * @deprecated Use TestHelpers.closeSnackbar() for better stability
 */
export async function closeSnackbar(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.closeSnackbar();
}

/**
 * Navigate to annonces list page
 * @deprecated Use TestHelpers.navigateToAnnonces() for better stability
 */
export async function navigateToAnnonces(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.navigateToAnnonces();
}

/**
 * Get annonce ID from current URL
 */
export function extractAnnonceId(url: string): string | null {
  const match = url.match(/annonces\/(\d+)/);
  return match ? match[1] : null;
}
