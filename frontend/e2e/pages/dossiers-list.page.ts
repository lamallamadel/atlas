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
    await this.page.waitForSelector('table.data-table, .dossier-card, .empty-message', { timeout: 15000 });
  }

  async createDossier(leadName: string, leadPhone: string) {
    await this.createButton.first().click();
    
    await this.page.locator('input#leadName, input[name="leadName"]').fill(leadName);
    await this.page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);
    
    const submitButton = this.page.locator('button[type="submit"], button:has-text("Créer")');
    await submitButton.click();
    
    await this.page.waitForURL(/.*dossiers\/\d+/, { timeout: 15000 });
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
