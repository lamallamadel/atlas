import { Page, Locator } from '@playwright/test';

export class AnnoncesListPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly annonceTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("Créer")');
    this.searchInput = page.locator('input[placeholder*="Rechercher"]');
    this.annonceTable = page.locator('table.data-table');
  }

  async goto() {
    await this.page.goto('/annonces');
    await this.page.waitForSelector('app-generic-table, app-empty-state, table.data-table, .empty-message', { timeout: 10000 });
  }

  async createAnnonce() {
    await this.createButton.click();
    await this.page.waitForURL(/.*annonces\/new/, { timeout: 5000 });
  }

  async getAnnonceRowByTitle(title: string) {
    return this.annonceTable.locator('tbody tr').filter({ hasText: title });
  }

  async hasAnnonceWithTitle(title: string): Promise<boolean> {
    const row = await this.getAnnonceRowByTitle(title);
    return await row.count() > 0;
  }
}

export class AnnonceCreatePage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly categorySelect: Locator;
  readonly typeSelect: Locator;
  readonly priceInput: Locator;
  readonly cityInput: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator('input[formControlName="title"], input#title');
    this.descriptionInput = page.locator('textarea[formControlName="description"], textarea#description');
    this.categorySelect = page.locator('select[formControlName="category"], select#category');
    this.typeSelect = page.locator('select[formControlName="annonceType"], select#annonceType');
    this.priceInput = page.locator('input[formControlName="price"], input#price');
    this.cityInput = page.locator('input[formControlName="city"], input#city');
    this.nextButton = page.locator('button:has-text("Suivant")');
    this.previousButton = page.locator('button:has-text("Précédent")');
    this.submitButton = page.locator('button:has-text("Créer l\'annonce"), button:has-text("Enregistrer")');
    this.cancelButton = page.locator('button:has-text("Annuler")');
  }

  async fillStep1(title: string, category: string, type: string, description?: string) {
    await this.titleInput.fill(title);
    await this.categorySelect.selectOption(category);
    await this.typeSelect.selectOption(type);
    if (description) {
      await this.descriptionInput.fill(description);
    }
  }

  async fillStep2(price?: number, city?: string) {
    if (price !== undefined) {
      await this.priceInput.fill(price.toString());
    }
    if (city) {
      await this.cityInput.fill(city);
    }
  }

  async goToNextStep() {
    await this.nextButton.click();
    await this.page.waitForTimeout(500);
  }

  async submitForm() {
    await this.submitButton.click();
  }
}

export class AnnonceDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly editButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingState: Locator;
  readonly detailContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.locator('button.btn-back');
    this.editButton = page.locator('button.btn-edit');
    this.errorMessage = page.locator('.error-message, .error-state');
    this.loadingState = page.locator('.loading-state');
    this.detailContent = page.locator('.detail-content');
  }

  async isErrorDisplayed(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isLoadingDisplayed(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  async waitForContent() {
    await this.detailContent.waitFor({ state: 'visible', timeout: 10000 });
  }

  async goBack() {
    await this.backButton.click();
  }
}
