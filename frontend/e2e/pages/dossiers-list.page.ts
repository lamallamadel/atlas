import { Page, Locator } from '@playwright/test';

export class DossiersListPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly dossiersTable: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    this.dossiersTable = page.locator('table.data-table');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Rechercher"]');
    this.statusFilter = page.locator('select#status-filter, select[name="status"]');
  }

  async goto() {
    await this.page.goto('/dossiers');
    await this.page.waitForSelector('app-generic-table, app-empty-state, table.data-table, .dossier-card, .empty-message, .empty-state-message', { timeout: 30000 });
  }

  async createDossier(leadName: string, leadPhone: string) {
    await this.createButton.first().click();

    await this.page.locator('input#leadName, input[name="leadName"]').fill(leadName);
    await this.page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

    const submitButton = this.page.locator('button[type="submit"], button:has-text("Créer")');
    await submitButton.waitFor({ state: 'visible' });
    // Retry click if navigation doesn't start or validation fails
    // Playwright's click auto-waits for actionability, but explicit wait ensures readiness
    await submitButton.click();

    // Wait for the URL to change, indicating a successful creation and redirect
    try {
      await this.page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
    } catch (e) {
      console.log('Timeout waiting for redirect. Checking for validation errors...');
      // Optional: check for validation error presence if redirect fails
      const errorMsg = this.page.locator('.error-message, mat-error');
      if (await errorMsg.count() > 0) {
        console.error('Validation error found:', await errorMsg.first().textContent());
      }
      throw e;
    }
  }

  async openFirstDossier() {
    const firstRow = this.dossiersTable.locator('tbody tr').first();
    await firstRow.click();
    await this.page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
  }

  async hasDossiers(): Promise<boolean> {
    const rows = this.dossiersTable.locator('tbody tr');
    return (await rows.count()) > 0;
  }

  async getDossierCount(): Promise<number> {
    const rows = this.dossiersTable.locator('tbody tr');
    return rows.count();
  }

  async searchDossier(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForTimeout(500);
  }
}
