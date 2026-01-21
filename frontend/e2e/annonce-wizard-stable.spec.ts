import { test, expect } from './stable-test-fixture';

class AnnoncesListPage {
  constructor(private helpers: any, private page: any) {}

  async goto() {
    await this.page.goto('/annonces');
    await this.helpers.waitForSelector(
      'app-generic-table, app-empty-state, .page-title',
      { timeout: 30000 }
    );
  }

  async clickCreateButton() {
    const createButton = await this.helpers.waitForSelector('button:has-text("Créer")');
    await createButton.click();
    await this.helpers.retryAssertion(async () => {
      await this.page.waitForURL(/.*annonces\/new/, { timeout: 10000 });
    });
  }

  async verifyAnnonceInList(title: string): Promise<boolean> {
    return await this.helpers.retryAssertion(async () => {
      const row = this.page.locator('app-generic-table table tbody tr').filter({ hasText: title });
      const count = await row.count();
      return count > 0;
    });
  }

  async openAnnonceDetail(title: string) {
    const row = this.page.locator('app-generic-table table tbody tr').filter({ hasText: title });
    await row.click();
    await this.helpers.retryAssertion(async () => {
      await this.page.waitForURL(/.*annonces\/\d+$/, { timeout: 10000 });
    });
  }
}

class AnnonceWizardPage {
  constructor(private helpers: any, private page: any) {}

  async fillStep1(category: string, type: string, title: string, description: string) {
    await this.page.locator('select#category').selectOption(category);
    await this.page.locator('select#annonceType').selectOption(type);
    await this.page.locator('input#title').fill(title);
    await this.page.locator('textarea#description').fill(description);
  }

  async clickNextStep() {
    const nextButton = await this.helpers.waitForSelector('button.btn-next');
    await nextButton.click();
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
    const addButton = await this.helpers.waitForSelector('button.btn-add-photo');
    await addButton.click();
    await this.page.waitForTimeout(300);
  }

  async fillStep4RulesJson(jsonString: string) {
    await this.page.locator('textarea#rulesJson').fill(jsonString);
  }

  async clickSubmit() {
    const submitButton = await this.helpers.waitForSelector('button.btn-submit');
    
    const createPromise = this.helpers.waitForApiResponse(/\/api\/v1\/annonces$/, {
      expectedStatus: 201,
    });
    
    await submitButton.click();
    
    return await createPromise;
  }
}

class AnnonceDetailPage {
  constructor(private helpers: any, private page: any) {}

  async clickEdit() {
    const editButton = await this.helpers.waitForSelector('button.btn-edit');
    await editButton.click();
    await this.helpers.retryAssertion(async () => {
      await this.page.waitForURL(/.*annonces\/\d+\/edit/, { timeout: 10000 });
    });
  }

  async goBack() {
    const backButton = await this.helpers.waitForSelector('button.btn-back');
    await backButton.click();
    await this.helpers.retryAssertion(async () => {
      await this.page.waitForURL(/.*annonces$/, { timeout: 10000 });
    });
  }

  async getTitle(): Promise<string> {
    const titleValue = this.page.locator('.detail-value.detail-title');
    return (await titleValue.textContent()) || '';
  }

  async getCity(): Promise<string> {
    const cityRow = this.page.locator('.detail-row:has-text("Ville")');
    const cityValue = cityRow.locator('.detail-value');
    return (await cityValue.textContent()) || '';
  }
}

test.describe('Annonce Wizard E2E Tests (Stabilized)', () => {
  test.beforeEach(async ({ page, helpers }) => {
    await helpers.retryAssertion(async () => {
      await page.goto('/');
      await page.waitForSelector('app-root', { timeout: 10000 });
    });
  });

  test.afterEach(async ({ dataCleanup }) => {
    await dataCleanup.fullCleanup();
  });

  test('Create and edit annonce via wizard with stable waits', async ({ 
    page, 
    helpers, 
    dataCleanup 
  }) => {
    const annoncesPage = new AnnoncesListPage(helpers, page);
    const wizardPage = new AnnonceWizardPage(helpers, page);
    const detailPage = new AnnonceDetailPage(helpers, page);

    const timestamp = Date.now();
    const annonceTitle = `E2E Stable Test ${timestamp}`;
    const annonceDescription = `Stable test annonce ${new Date().toISOString()}`;
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

    await wizardPage.addPhoto(photo1);
    await wizardPage.addPhoto(photo2);
    await wizardPage.clickNextStep();

    const validJson = '{"allowPets": true, "smokingAllowed": false}';
    await wizardPage.fillStep4RulesJson(validJson);

    const { body: createdAnnonce } = await wizardPage.clickSubmit();
    expect(createdAnnonce.id).toBeTruthy();
    dataCleanup.trackAnnonce(createdAnnonce.id);

    await helpers.retryAssertion(async () => {
      await page.waitForURL(/\/annonces$/, { timeout: 15000 });
    });

    await helpers.closeSnackbar();

    await helpers.retryAssertion(async () => {
      const exists = await annoncesPage.verifyAnnonceInList(annonceTitle);
      expect(exists).toBeTruthy();
    }, { maxAttempts: 3, delayMs: 1000 });

    await annoncesPage.openAnnonceDetail(annonceTitle);
    await expect(page).toHaveURL(/\/annonces\/\d+$/);

    await helpers.retryAssertion(async () => {
      const title = await detailPage.getTitle();
      expect(title).toBe(annonceTitle);
    });

    const cityText = await detailPage.getCity();
    expect(cityText).toBe(city);

    await detailPage.clickEdit();
    await expect(page).toHaveURL(/\/annonces\/\d+\/edit/);

    await page.locator('input#title').fill(updatedTitle);
    await wizardPage.clickNextStep();

    await page.locator('input#city').fill('Lyon');
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();

    const updatePromise = helpers.waitForApiResponse(/\/api\/v1\/annonces\/\d+$/, {
      expectedStatus: 200,
    });

    const submitButton = await helpers.waitForSelector('button.btn-submit');
    await submitButton.click();

    const { body: updatedAnnonce } = await updatePromise;
    expect(updatedAnnonce.title).toBe(updatedTitle);

    await helpers.retryAssertion(async () => {
      await page.waitForURL(/\/annonces$/, { timeout: 15000 });
    });

    await helpers.closeSnackbar();

    await helpers.retryAssertion(async () => {
      const exists = await annoncesPage.verifyAnnonceInList(updatedTitle);
      expect(exists).toBeTruthy();
    }, { maxAttempts: 3, delayMs: 1000 });

    await annoncesPage.openAnnonceDetail(updatedTitle);
    
    await helpers.retryAssertion(async () => {
      const title = await detailPage.getTitle();
      expect(title).toBe(updatedTitle);
    });

    const updatedCity = await detailPage.getCity();
    expect(updatedCity).toBe('Lyon');
  });

  test('Validate JSON in step 4 with retry logic', async ({ 
    page, 
    helpers, 
    dataCleanup 
  }) => {
    const annoncesPage = new AnnoncesListPage(helpers, page);
    const wizardPage = new AnnonceWizardPage(helpers, page);

    await annoncesPage.goto();
    await annoncesPage.clickCreateButton();

    await wizardPage.fillStep1('STUDIO', 'RENT', 'JSON Test', 'Testing JSON');
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();

    const invalidJson = '{"key": "value"';
    await wizardPage.fillStep4RulesJson(invalidJson);
    await page.waitForTimeout(300);

    await helpers.retryAssertion(async () => {
      const error = page.locator('.field-error').filter({ hasText: /JSON/i });
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    const validJson = '{"valid": true}';
    await wizardPage.fillStep4RulesJson(validJson);
    await page.waitForTimeout(300);

    await helpers.retryAssertion(async () => {
      const error = page.locator('.field-error').filter({ hasText: /JSON/i });
      const count = await error.count();
      expect(count).toBe(0);
    });

    const { body: createdAnnonce } = await wizardPage.clickSubmit();
    dataCleanup.trackAnnonce(createdAnnonce.id);
  });

  test('Photo management with proper waits', async ({ 
    page, 
    helpers, 
    dataCleanup 
  }) => {
    const annoncesPage = new AnnoncesListPage(helpers, page);
    const wizardPage = new AnnonceWizardPage(helpers, page);

    await annoncesPage.goto();
    await annoncesPage.clickCreateButton();

    await wizardPage.fillStep1('COMMERCIAL', 'LEASE', 'Photo Test', 'Testing photos');
    await wizardPage.clickNextStep();
    await wizardPage.clickNextStep();

    const photos = [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg',
    ];

    for (const photo of photos) {
      await wizardPage.addPhoto(photo);
    }

    await helpers.retryAssertion(async () => {
      const photoRows = page.locator('.photo-row');
      const count = await photoRows.count();
      expect(count).toBe(photos.length);
    });

    await wizardPage.clickNextStep();

    const { body: createdAnnonce } = await wizardPage.clickSubmit();
    dataCleanup.trackAnnonce(createdAnnonce.id);
  });
});
