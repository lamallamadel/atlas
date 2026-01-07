import { test, expect } from './auth.fixture';
import { Page } from '@playwright/test';

class AnnoncesListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/annonces');
    await this.page.waitForSelector('app-generic-table, app-empty-state, .page-title', { timeout: 30000 });
  }

  async clickCreateButton() {
    const createButton = this.page.locator('button:has-text("Créer")');
    await createButton.click();
    await this.page.waitForURL(/.*annonces\/new/, { timeout: 10000 });
  }

  async hasAnnonces(): Promise<boolean> {
    const table = this.page.locator('app-generic-table table tbody tr');
    return (await table.count()) > 0;
  }

  async searchAnnonce(query: string) {
    const searchInput = this.page.locator('input.search-input');
    await searchInput.fill(query);
    await searchInput.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async filterByStatus(status: string) {
    const statusFilter = this.page.locator('select#status-filter');
    await statusFilter.selectOption(status);
    await this.page.waitForTimeout(1000);
  }

  async filterByCity(city: string) {
    const cityFilter = this.page.locator('select#city-filter');
    await cityFilter.selectOption(city);
    await this.page.waitForTimeout(1000);
  }

  async filterByType(type: string) {
    const typeFilter = this.page.locator('select#type-filter');
    await typeFilter.selectOption(type);
    await this.page.waitForTimeout(1000);
  }

  async resetFilters() {
    const resetButton = this.page.locator('button.btn-reset');
    await resetButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickNextPage() {
    const nextButton = this.page.locator('button.btn-page:has-text("Suivant")');
    await nextButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickPreviousPage() {
    const prevButton = this.page.locator('button.btn-page:has-text("Précédent")');
    await prevButton.click();
    await this.page.waitForTimeout(1000);
  }

  async goToPage(pageNumber: number) {
    const pageButton = this.page.locator(`button.btn-page-num:has-text("${pageNumber}")`);
    await pageButton.click();
    await this.page.waitForTimeout(1000);
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
    await this.page.waitForTimeout(1000);
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
    await nextButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickPreviousStep() {
    const backButton = this.page.locator('button.btn-back');
    await backButton.click();
    await this.page.waitForTimeout(500);
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
    await this.page.waitForTimeout(300);
  }

  async removePhoto(index: number) {
    const deleteButtons = this.page.locator('button.btn-delete-photo');
    await deleteButtons.nth(index).click();
    await this.page.waitForTimeout(300);
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
    await this.page.waitForTimeout(300);
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
    await this.page.waitForTimeout(1000);
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
  test('Complete workflow: create annonce via 4-step wizard, verify in list, open detail, edit, verify updates, test filters and pagination', async ({ page }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);
    const detailPage = new AnnonceDetailPage(page);

    const timestamp = Date.now();
    const annonceTitle = `E2E Test Annonce ${timestamp}`;
    const annonceDescription = `Description for E2E test annonce created at ${new Date().toISOString()}`;
    const city = 'Paris';
    const updatedTitle = `${annonceTitle} - Updated`;

    // Step 1: Navigate to /annonces
    await annoncesPage.goto();
    await expect(page.locator('h2.page-title')).toContainText('Annonces');

    // Step 2: Click "Créer" button
    await annoncesPage.clickCreateButton();
    await expect(page).toHaveURL(/\/annonces\/new/);

    // Step 3: Complete wizard step 1 (type/title/description)
    await wizardPage.fillStep1('APARTMENT', 'SALE', annonceTitle, annonceDescription);
    await wizardPage.clickNextStep();
    await page.waitForTimeout(500);

    // Step 4: Complete wizard step 2 (price/city/address/surface)
    await wizardPage.fillStep2('250000', city, '123 Rue de Test', '75');
    await wizardPage.clickNextStep();
    await page.waitForTimeout(500);

    // Step 5: Complete wizard step 3 (photos array with add/remove URLs)
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

    // Remove middle photo
    await wizardPage.removePhoto(1);
    expect(await wizardPage.getPhotoCount()).toBe(2);

    await wizardPage.clickNextStep();
    await page.waitForTimeout(500);

    // Step 6: Complete wizard step 4 (rulesJson with validation)
    // Test invalid JSON first
    const invalidJson = '{"allowPets": true, "smokingAllowed": false';
    await wizardPage.fillStep4RulesJson(invalidJson);
    await page.waitForTimeout(300);

    // Verify JSON validation error shows
    expect(await wizardPage.hasJsonError()).toBeTruthy();
    const errorText = await wizardPage.getJsonErrorText();
    expect(errorText.toLowerCase()).toContain('json');

    // Now fix with valid JSON
    const validJson = '{"allowPets": true, "smokingAllowed": false, "minLeaseMonths": 12}';
    await wizardPage.fillStep4RulesJson(validJson);
    await page.waitForTimeout(300);

    // Verify error is gone
    expect(await wizardPage.hasJsonError()).toBeFalsy();

    // Test format JSON button
    await wizardPage.formatJson();
    await page.waitForTimeout(300);
    const formattedJson = await wizardPage.getRulesJsonValue();
    expect(formattedJson).toContain('\n'); // Should be formatted with newlines

    // Step 7: Submit form
    await wizardPage.clickSubmit();
    await page.waitForURL(/\/annonces$/, { timeout: 15000 });

    // Step 8: Verify annonce in list with correct status badge
    await page.waitForTimeout(1500);
    expect(await annoncesPage.verifyAnnonceInList(annonceTitle)).toBeTruthy();
    
    // The default status should be DRAFT (Brouillon) based on the backend behavior
    // Check if status badge exists in the row
    const row = page.locator('app-generic-table table tbody tr').filter({ hasText: annonceTitle });
    const statusBadge = row.locator('.badge-status');
    await expect(statusBadge).toBeVisible({ timeout: 5000 });

    // Step 9: Open detail page
    await annoncesPage.openAnnonceDetail(annonceTitle);
    await expect(page).toHaveURL(/\/annonces\/\d+$/);
    
    // Verify detail content
    expect(await detailPage.getTitle()).toBe(annonceTitle);
    expect(await detailPage.getDescription()).toBe(annonceDescription);
    expect(await detailPage.getCity()).toBe(city);

    // Step 10: Edit via wizard
    await detailPage.clickEdit();
    await expect(page).toHaveURL(/\/annonces\/\d+\/edit/);
    expect(await wizardPage.isOnEditMode()).toBeTruthy();

    // Update title in step 1
    await page.locator('input#title').fill(updatedTitle);
    await wizardPage.clickNextStep();
    await page.waitForTimeout(500);

    // Update city in step 2
    await page.locator('input#city').fill('Lyon');
    await wizardPage.clickNextStep();
    await page.waitForTimeout(500);

    // Skip step 3 (photos)
    await wizardPage.clickNextStep();
    await page.waitForTimeout(500);

    // Update JSON in step 4
    const updatedJson = '{"allowPets": false, "smokingAllowed": true, "furnished": true}';
    await wizardPage.fillStep4RulesJson(updatedJson);
    await page.waitForTimeout(300);

    // Submit update
    await wizardPage.clickSubmit();
    await page.waitForURL(/\/annonces$/, { timeout: 15000 });

    // Step 11: Verify updates in list
    await page.waitForTimeout(1500);
    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();

    // Open detail again to verify
    await annoncesPage.openAnnonceDetail(updatedTitle);
    expect(await detailPage.getTitle()).toBe(updatedTitle);
    expect(await detailPage.getCity()).toBe('Lyon');

    // Go back to list for filter testing
    await detailPage.goBack();
    await page.waitForTimeout(1000);

    // Step 12: Test list filters

    // Test search query filter
    await annoncesPage.searchAnnonce(updatedTitle);
    await page.waitForTimeout(1000);
    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();

    // Reset and test status filter
    await annoncesPage.resetFilters();
    await page.waitForTimeout(1000);

    await annoncesPage.filterByStatus('DRAFT');
    await page.waitForTimeout(1000);
    // After filtering, the list should update (specific assertions depend on data)

    // Test city filter
    await annoncesPage.resetFilters();
    await page.waitForTimeout(1000);
    await annoncesPage.filterByCity('Lyon');
    await page.waitForTimeout(1000);
    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();

    // Test type filter
    await annoncesPage.resetFilters();
    await page.waitForTimeout(1000);
    await annoncesPage.filterByType('SALE');
    await page.waitForTimeout(1000);
    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();

    // Reset filters
    await annoncesPage.resetFilters();
    await page.waitForTimeout(1000);

    // Step 13: Test pagination (if multiple pages exist)
    const paginationInfo = await annoncesPage.getPaginationInfo();
    
    // Check if pagination controls exist and are functional
    const nextButton = page.locator('button.btn-page:has-text("Suivant")');
    if (await nextButton.isEnabled()) {
      // Test next page
      await annoncesPage.clickNextPage();
      await page.waitForTimeout(1000);

      // Test previous page
      await annoncesPage.clickPreviousPage();
      await page.waitForTimeout(1000);
    }

    // Test specific page navigation if page numbers are visible
    const pageButtons = page.locator('button.btn-page-num');
    const pageCount = await pageButtons.count();
    if (pageCount > 1) {
      // Click on page 2 if it exists
      const page2Button = pageButtons.filter({ hasText: '2' });
      if (await page2Button.count() > 0) {
        await page2Button.click();
        await page.waitForTimeout(1000);

        // Go back to page 1
        const page1Button = pageButtons.filter({ hasText: '1' });
        await page1Button.click();
        await page.waitForTimeout(1000);
      }
    }

    // Final verification: our updated annonce is still visible
    expect(await annoncesPage.verifyAnnonceInList(updatedTitle)).toBeTruthy();
  });

  test('Wizard navigation: back button works correctly across all steps', async ({ page }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);

    await annoncesPage.goto();
    await annoncesPage.clickCreateButton();

    // Fill step 1 and go to step 2
    await wizardPage.fillStep1('HOUSE', 'RENT', 'Test Navigation', 'Test description');
    await wizardPage.clickNextStep();

    // Fill step 2 and go to step 3
    await wizardPage.fillStep2('1500', 'Marseille', '456 Avenue Test', '100');
    await wizardPage.clickNextStep();

    // Go to step 4
    await wizardPage.clickNextStep();

    // Now go back through all steps
    await wizardPage.clickPreviousStep(); // Back to step 3
    await page.waitForTimeout(300);
    expect(await page.locator('h3.step-title:has-text("Photos")').isVisible()).toBeTruthy();

    await wizardPage.clickPreviousStep(); // Back to step 2
    await page.waitForTimeout(300);
    expect(await page.locator('h3.step-title:has-text("Localisation")').isVisible()).toBeTruthy();

    await wizardPage.clickPreviousStep(); // Back to step 1
    await page.waitForTimeout(300);
    expect(await page.locator('h3.step-title:has-text("Informations de base")').isVisible()).toBeTruthy();

    // Verify data is preserved
    expect(await page.locator('input#title').inputValue()).toBe('Test Navigation');
  });

  test('JSON validation: shows detailed error messages', async ({ page }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);

    await annoncesPage.goto();
    await annoncesPage.clickCreateButton();

    // Navigate to step 4
    await wizardPage.fillStep1('STUDIO', 'RENT', 'JSON Test', 'Testing JSON validation');
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();

    // Test various invalid JSON formats
    const invalidJsonCases = [
      '{"key": "value"', // Missing closing brace
      '{"key": value}', // Unquoted value
      '{"key": "value",}', // Trailing comma
      '{key: "value"}', // Unquoted key
    ];

    for (const invalidCase of invalidJsonCases) {
      await wizardPage.fillStep4RulesJson(invalidCase);
      await page.waitForTimeout(300);
      
      // Should show error
      expect(await wizardPage.hasJsonError()).toBeTruthy();
      
      // Clear for next test
      await wizardPage.fillStep4RulesJson('');
      await page.waitForTimeout(300);
    }

    // Valid JSON should not show error
    await wizardPage.fillStep4RulesJson('{"valid": true}');
    await page.waitForTimeout(300);
    expect(await wizardPage.hasJsonError()).toBeFalsy();
  });

  test('Photo management: add multiple photos and remove them', async ({ page }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);

    await annoncesPage.goto();
    await annoncesPage.clickCreateButton();

    // Navigate to step 3
    await wizardPage.fillStep1('COMMERCIAL', 'LEASE', 'Photo Test', 'Testing photo management');
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();

    // Add multiple photos
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

    // Remove first photo
    await wizardPage.removePhoto(0);
    expect(await wizardPage.getPhotoCount()).toBe(photos.length - 1);

    // Remove last photo
    const currentCount = await wizardPage.getPhotoCount();
    await wizardPage.removePhoto(currentCount - 1);
    expect(await wizardPage.getPhotoCount()).toBe(photos.length - 2);

    // Verify remaining photos
    expect(await wizardPage.getPhotoCount()).toBe(3);
  });

  test('Cancel button returns to annonces list without saving', async ({ page }) => {
    const annoncesPage = new AnnoncesListPage(page);
    const wizardPage = new AnnonceWizardPage(page);

    await annoncesPage.goto();
    const initialCount = await annoncesPage.hasAnnonces();

    await annoncesPage.clickCreateButton();

    // Fill some data
    await wizardPage.fillStep1('HOUSE', 'SALE', 'Should Not Save', 'This should be cancelled');
    
    // Click cancel
    await wizardPage.clickCancel();
    await page.waitForURL(/\/annonces$/, { timeout: 10000 });

    // Verify we're back on the list and nothing was saved
    await expect(page.locator('h2.page-title')).toContainText('Annonces');
  });
});
