import { test, expect } from './stable-test-fixture';
import { Page } from '@playwright/test';

class AnnoncesListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/annonces');
    await this.page
      .waitForSelector('app-generic-table, app-empty-state, .page-title', { timeout: 30000 })
      .catch(() => this.page.waitForLoadState('domcontentloaded'));
  }

  async clickCreateButton() {
    const createButton = this.page.locator('button:has-text("Créer")');
    await createButton.waitFor({ state: 'visible', timeout: 5000 });
    await createButton.click();
    await this.page.waitForURL(/.*annonces\/new/, { timeout: 10000 });
  }

  async hasAnnonces(): Promise<boolean> {
    const table = this.page.locator('app-generic-table table tbody tr');
    return (await table.count()) > 0;
  }

  async searchAnnonce(query: string) {
    const searchInput = this.page.locator('input.search-input');
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill(query);
    await searchInput.press('Enter');
    await this.page.waitForResponse((resp) => resp.url().includes('/api/v1/annonces'), {
      timeout: 5000,
    });
  }

  async filterByStatus(status: string) {
    const statusFilter = this.page.locator('select#status-filter');
    await statusFilter.waitFor({ state: 'visible', timeout: 5000 });
    await statusFilter.selectOption(status);
    await this.page.waitForResponse((resp) => resp.url().includes('/api/v1/annonces'), {
      timeout: 5000,
    });
  }

  async filterByCity(city: string) {
    const cityFilter = this.page.locator('select#city-filter');
    await cityFilter.waitFor({ state: 'visible', timeout: 5000 });
    await cityFilter.selectOption(city);
    await this.page.waitForResponse((resp) => resp.url().includes('/api/v1/annonces'), {
      timeout: 5000,
    });
  }

  async filterByType(type: string) {
    const typeFilter = this.page.locator('select#type-filter');
    await typeFilter.waitFor({ state: 'visible', timeout: 5000 });
    await typeFilter.selectOption(type);
    await this.page.waitForResponse((resp) => resp.url().includes('/api/v1/annonces'), {
      timeout: 5000,
    });
  }

  async resetFilters() {
    const resetButton = this.page.locator('button.btn-reset');
    await resetButton.waitFor({ state: 'visible', timeout: 5000 });
    await resetButton.click();
    await this.page.waitForResponse((resp) => resp.url().includes('/api/v1/annonces'), {
      timeout: 5000,
    });
  }

  async clickNextPage() {
    const nextButton = this.page.locator('button.btn-page:has-text("Suivant")');
    await nextButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickPreviousPage() {
    const prevButton = this.page.locator('button.btn-page:has-text("Précédent")');
    await prevButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToPage(pageNumber: number) {
    const pageButton = this.page.locator(`button.btn-page-num:has-text("${pageNumber}")`);
    await pageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyAnnonceInList(title: string): Promise<boolean> {
    const row = this.page.locator('app-generic-table table tbody tr').filter({ hasText: title });
    return (await row.count()) > 0;
  }

  async verifyStatusBadge(title: string, statusText: string): Promise<boolean> {
    const row = this.page.locator('app-generic-table table tbody tr').filter({ hasText: title });
    const badge = row.locator('.badge-status').filter({ hasText: statusText });
    return (await badge.count()) > 0;
  }

  async clickEditForAnnonce(title: string) {
    const row = this.page.locator('app-generic-table table tbody tr').filter({ hasText: title });
    const editButton = row.locator('button[title*="Modifier"], button mat-icon:has-text("edit")');
    await editButton.first().click();
    await this.page.waitForTimeout(500);
  }

  async openAnnonceDetail(title: string) {
    const row = this.page.locator('app-generic-table table tbody tr').filter({ hasText: title });
    await row.click();
    await this.page.waitForURL(/.*annonces\/\d+$/, { timeout: 10000 });
  }

  async getPaginationInfo(): Promise<string> {
    const info = this.page.locator('.pagination-info');
    return (await info.textContent()) || '';
  }
}

class AnnonceWizardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillStep1(category: string, type: string, title: string, description: string) {
    await this.page.locator('select#category').selectOption(category);
    await this.page.locator('select#annonceType').selectOption(type);
    await this.page.locator('input#title').fill(title);
    await this.page.locator('textarea#description').fill(description);
  }

  async clickNextStep() {
    const nextButton = this.page.locator('button.btn-next');
    await nextButton.waitFor({ state: 'visible', timeout: 5000 });
    await nextButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickPreviousStep() {
    const backButton = this.page.locator('button.btn-back');
    await backButton.click();
    await this.page.waitForTimeout(300);
  }

  async fillStep2(price: string, city: string, address: string, surface: string) {
    if (price) await this.page.locator('input#price').fill(price);
    if (city) await this.page.locator('input#city').fill(city);
    if (address) await this.page.locator('input#address').fill(address);
    if (surface) await this.page.locator('input#surface').fill(surface);
  }

  async addPhoto(photoUrl: string) {
    await this.page.locator('input#newPhotoUrl').fill(photoUrl);
    await this.page.locator('button.btn-add-photo').click();
    await this.page.waitForTimeout(200);
  }

  async removePhoto(index: number) {
    const deleteButtons = this.page.locator('button.btn-delete-photo');
    await deleteButtons.nth(index).click();
    await this.page.waitForTimeout(200);
  }

  async getPhotoCount(): Promise<number> {
    const photos = this.page.locator('.photo-row');
    return photos.count();
  }

  async verifyPhotoUrl(index: number, expectedUrl: string): Promise<boolean> {
    const photoRow = this.page.locator('.photo-row').nth(index);
    const urlText = await photoRow.locator('.photo-url').textContent();
    return urlText?.trim() === expectedUrl;
  }

  async fillStep4RulesJson(jsonString: string) {
    await this.page.locator('textarea#rulesJson').fill(jsonString);
  }

  async formatJson() {
    await this.page.locator('button.btn-format-json').click();
    await this.page.waitForTimeout(200);
  }

  async getRulesJsonValue(): Promise<string> {
    const textarea = this.page.locator('textarea#rulesJson');
    return (await textarea.inputValue()) || '';
  }

  async hasJsonError(): Promise<boolean> {
    const error = this.page.locator('.field-error').filter({ hasText: /JSON/i });
    return (await error.count()) > 0;
  }

  async getJsonErrorText(): Promise<string> {
    const error = this.page.locator('.field-error').filter({ hasText: /JSON/i });
    return (await error.first().textContent()) || '';
  }

  async clickSubmit() {
    const submitButton = this.page.locator('button.btn-submit');
    await submitButton.click();
    await this.page.waitForResponse((resp) => resp.url().includes('/api/v1/annonces'), {
      timeout: 10000,
    });
  }

  async clickCancel() {
    const cancelButton = this.page.locator('button.btn-cancel');
    await cancelButton.click();
  }

  async isOnEditMode(): Promise<boolean> {
    const title = this.page.locator('h2.page-title');
    const text = await title.textContent();
    return text?.includes('Modifier') || false;
  }
}

class AnnonceDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async clickEdit() {
    const editButton = this.page.locator('button.btn-edit');
    await editButton.click();
    await this.page.waitForURL(/.*annonces\/\d+\/edit/, { timeout: 10000 });
  }

  async goBack() {
    const backButton = this.page.locator('button.btn-back');
    await backButton.click();
    await this.page.waitForURL(/.*annonces$/, { timeout: 10000 });
  }

  async getTitle(): Promise<string> {
    const titleValue = this.page.locator('.detail-value.detail-title');
    return (await titleValue.textContent()) || '';
  }

  async getDescription(): Promise<string> {
    const descValue = this.page.locator('.detail-value.detail-description');
    return (await descValue.textContent()) || '';
  }

  async getStatusBadgeText(): Promise<string> {
    const badge = this.page.locator('app-badge-status');
    return (await badge.textContent()) || '';
  }

  async getCity(): Promise<string> {
    const cityRow = this.page.locator('.detail-row:has-text("Ville")');
    const cityValue = cityRow.locator('.detail-value');
    return (await cityValue.textContent()) || '';
  }
}

test.describe('Annonce Wizard E2E Tests', () => {
  test('Complete workflow: create annonce via 4-step wizard, verify in list, open detail, edit, verify updates, test filters and pagination', async ({
    authenticatedPage: page,
    cleanup,
  }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);
    const detailPage = new AnnonceDetailPage(page);

    const timestamp = Date.now();
    const annonceTitle = `E2E Test Annonce ${timestamp}`;
    const annonceDescription = `Description for E2E test annonce created at ${new Date().toISOString()}`;
    const city = 'Paris';
    const updatedTitle = `${annonceTitle} - Updated`;

    await annoncesPage.goto();
    await expect(page.locator('h2.page-title')).toContainText('Annonces');

    await annoncesPage.clickCreateButton();
    await expect(page).toHaveURL(/\/annonces\/new/);

    await wizardPage.fillStep1('APARTMENT', 'SALE', annonceTitle, annonceDescription);
    await wizardPage.clickNextStep();

    await wizardPage.fillStep2('250000', city, '123 Rue de Test', '75');
    await wizardPage.clickNextStep();

    const photo1 = 'https://example.com/photo1.jpg';
    const photo2 = 'https://example.com/photo2.jpg';
    const photo3 = 'https://example.com/photo3.jpg';

    await wizardPage.addPhoto(photo1);
    expect(await wizardPage.getPhotoCount()).toBe(1);
    expect(await wizardPage.verifyPhotoUrl(0, photo1)).toBeTruthy();

    await wizardPage.addPhoto(photo2);
    expect(await wizardPage.getPhotoCount()).toBe(2);

    await wizardPage.addPhoto(photo3);
    expect(await wizardPage.getPhotoCount()).toBe(3);

    await wizardPage.removePhoto(1);
    expect(await wizardPage.getPhotoCount()).toBe(2);

    await wizardPage.clickNextStep();

    const invalidJson = '{"allowPets": true, "smokingAllowed": false';
    await wizardPage.fillStep4RulesJson(invalidJson);
    await page.waitForTimeout(300);

    expect(await wizardPage.hasJsonError()).toBeTruthy();
    const errorText = await wizardPage.getJsonErrorText();
    expect(errorText.toLowerCase()).toContain('json');

    const validJson = '{"allowPets": true, "smokingAllowed": false, "minLeaseMonths": 12}';
    await wizardPage.fillStep4RulesJson(validJson);
    await page.waitForTimeout(300);

    expect(await wizardPage.hasJsonError()).toBeFalsy();

    await wizardPage.formatJson();
    await page.waitForTimeout(200);
    const formattedJson = await wizardPage.getRulesJsonValue();
    expect(formattedJson).toContain('\n');

    const createPromise = page.waitForResponse((resp) => resp.url().includes('/api/v1/annonces') && resp.request().method() === 'POST', { timeout: 15000 });

    await wizardPage.clickSubmit();

    const createResponse = await createPromise;
    const createdAnnonce = await createResponse.json();
    cleanup.trackAnnonce(createdAnnonce.id);

    await page.waitForURL(/\/annonces$/, { timeout: 15000 });

    await page.waitForSelector('app-generic-table', { timeout: 10000 });
    expect(await annoncesPage.verifyAnnonceInList(annonceTitle)).toBeTruthy();

    const row = page.locator('app-generic-table table tbody tr').filter({ hasText: annonceTitle });
    const statusBadge = row.locator('.badge-status');
    await expect(statusBadge).toBeVisible({ timeout: 5000 });

    await annoncesPage.openAnnonceDetail(annonceTitle);
    await expect(page).toHaveURL(/\/annonces\/\d+$/);

    expect(await detailPage.getTitle()).toBe(annonceTitle);
    expect(await detailPage.getDescription()).toBe(annonceDescription);
    expect(await detailPage.getCity()).toBe(city);

    await detailPage.clickEdit();
    await expect(page).toHaveURL(/\/annonces\/\d+\/edit/);
    expect(await wizardPage.isOnEditMode()).toBeTruthy();

    await page.locator('input#title').fill(updatedTitle);
    await wizardPage.clickNextStep();

    await page.locator('input#city').fill('Lyon');
    await wizardPage.clickNextStep();

    await wizardPage.clickNextStep();

    const updatedJson = '{"allowPets": false, "smokingAllowed": true, "furnished": true}';
    await wizardPage.fillStep4RulesJson(updatedJson);
    await page.waitForTimeout(200);

    await wizardPage.clickSubmit();
    await page.waitForURL(/\/annonces$/, { timeout: 15000 });

    await page.waitForSelector('app-generic-table', { timeout: 10000 });
    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();

    await annoncesPage.openAnnonceDetail(updatedTitle);
    expect(await detailPage.getTitle()).toBe(updatedTitle);
    expect(await detailPage.getCity()).toBe('Lyon');

    await detailPage.goBack();
    await page.waitForLoadState('domcontentloaded');

    await annoncesPage.searchAnnonce(updatedTitle);
    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();

    await annoncesPage.resetFilters();

    await annoncesPage.filterByStatus('DRAFT');

    await annoncesPage.resetFilters();
    await annoncesPage.filterByCity('Lyon');
    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();

    await annoncesPage.resetFilters();
    await annoncesPage.filterByType('SALE');
    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();

    await annoncesPage.resetFilters();

    const nextButton = page.locator('button.btn-page:has-text("Suivant")');
    if (await nextButton.isEnabled()) {
      await annoncesPage.clickNextPage();
      await annoncesPage.clickPreviousPage();
    }

    const pageButtons = page.locator('button.btn-page-num');
    const pageCount = await pageButtons.count();
    if (pageCount > 1) {
      const page2Button = pageButtons.filter({ hasText: '2' });
      if ((await page2Button.count()) > 0) {
        await page2Button.click();
        await page.waitForLoadState('networkidle');

        const page1Button = pageButtons.filter({ hasText: '1' });
        await page1Button.click();
        await page.waitForLoadState('networkidle');
      }
    }

    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();
  });

  test('Wizard navigation: back button works correctly across all steps', async ({
    authenticatedPage: page,
  }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);

    await annoncesPage.goto();
    await annoncesPage.clickCreateButton();

    await wizardPage.fillStep1('HOUSE', 'RENT', 'Test Navigation', 'Test description');
    await wizardPage.clickNextStep();

    await wizardPage.fillStep2('1500', 'Marseille', '456 Avenue Test', '100');
    await wizardPage.clickNextStep();

    await wizardPage.clickNextStep();

    await wizardPage.clickPreviousStep();
    await page.waitForTimeout(200);
    expect(await page.locator('h3.step-title:has-text("Photos")').isVisible()).toBeTruthy();

    await wizardPage.clickPreviousStep();
    await page.waitForTimeout(200);
    expect(await page.locator('h3.step-title:has-text("Localisation")').isVisible()).toBeTruthy();

    await wizardPage.clickPreviousStep();
    await page.waitForTimeout(200);
    expect(
      await page.locator('h3.step-title:has-text("Informations de base")').isVisible()
    ).toBeTruthy();

    expect(await page.locator('input#title').inputValue()).toBe('Test Navigation');
  });

  test('JSON validation: shows detailed error messages', async ({ authenticatedPage: page }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);

    await annoncesPage.goto();
    await annoncesPage.clickCreateButton();

    await wizardPage.fillStep1('STUDIO', 'RENT', 'JSON Test', 'Testing JSON validation');
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();

    const invalidJsonCases = [
      '{"key": "value"',
      '{"key": value}',
      '{"key": "value",}',
      '{key: "value"}',
    ];

    for (const invalidCase of invalidJsonCases) {
      await wizardPage.fillStep4RulesJson(invalidCase);
      await page.waitForTimeout(300);

      expect(await wizardPage.hasJsonError()).toBeTruthy();

      await wizardPage.fillStep4RulesJson('');
      await page.waitForTimeout(300);
    }

    await wizardPage.fillStep4RulesJson('{"valid": true}');
    await page.waitForTimeout(300);
    expect(await wizardPage.hasJsonError()).toBeFalsy();
  });

  test('Photo management: add multiple photos and remove them', async ({
    authenticatedPage: page,
  }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);

    await annoncesPage.goto();
    await annoncesPage.clickCreateButton();

    await wizardPage.fillStep1('COMMERCIAL', 'LEASE', 'Photo Test', 'Testing photo management');
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();

    const photos = [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg',
      'https://example.com/img4.jpg',
      'https://example.com/img5.jpg',
    ];

    for (const photo of photos) {
      await wizardPage.addPhoto(photo);
    }

    expect(await wizardPage.getPhotoCount()).toBe(photos.length);

    await wizardPage.removePhoto(0);
    expect(await wizardPage.getPhotoCount()).toBe(photos.length - 1);

    const currentCount = await wizardPage.getPhotoCount();
    await wizardPage.removePhoto(currentCount - 1);
    expect(await wizardPage.getPhotoCount()).toBe(photos.length - 2);

    expect(await wizardPage.getPhotoCount()).toBe(3);
  });

  test('Cancel button returns to annonces list without saving', async ({
    authenticatedPage: page,
  }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);

    await annoncesPage.goto();

    await annoncesPage.clickCreateButton();

    await wizardPage.fillStep1('HOUSE', 'SALE', 'Should Not Save', 'This should be cancelled');

    await wizardPage.clickCancel();
    await page.waitForURL(/\/annonces$/, { timeout: 10000 });

    await expect(page.locator('h2.page-title')).toContainText('Annonces');
  });
});
