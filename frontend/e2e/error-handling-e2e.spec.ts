import { test, expect } from './stable-test-fixture';
import { Page, Route } from '@playwright/test';
import {
  ProblemDetails,
  validateProblemDetails,
  validateErrorSnackbar,
  mockErrorResponse,
} from './api-validation';

class AnnonceCreatePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/annonces/new');
    await this.page.waitForSelector('mat-stepper, .page-title', { timeout: 30000 });
  }

  async clickNextStep() {
    const nextButton = this.page.locator('button.btn-next');
    await nextButton.waitFor({ state: 'visible', timeout: 5000 });
    await nextButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickSubmit() {
    const submitButton = this.page.locator('button.btn-submit');
    await submitButton.click();
    await this.page.waitForResponse((resp) => resp.url().includes('/api/v1/annonces'), {
      timeout: 10000,
    });
  }

  async hasFieldError(fieldName: string): Promise<boolean> {
    const errorElement = this.page.locator(`#${fieldName}`).locator('..').locator('.field-error');
    return (await errorElement.count()) > 0;
  }

  async getFieldError(fieldName: string): Promise<string> {
    const errorElement = this.page.locator(`#${fieldName}`).locator('..').locator('.field-error');
    return (await errorElement.textContent()) || '';
  }

  async isFieldInvalid(fieldName: string): Promise<boolean> {
    const field = this.page.locator(`#${fieldName}`);
    const hasInvalidClass = await field.evaluate((el) => el.classList.contains('invalid'));
    return hasInvalidClass;
  }

  async fillTitle(title: string) {
    await this.page.locator('#title').fill(title);
  }

  async fillCategory(category: string) {
    await this.page.locator('#category').selectOption(category);
  }

  async fillAnnonceType(type: string) {
    await this.page.locator('#annonceType').selectOption(type);
  }

  async hasMatError(fieldName: string): Promise<boolean> {
    const matError = this.page.locator(`mat-error:near(#${fieldName})`);
    return (await matError.count()) > 0;
  }
}

class AnnonceDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(id: number) {
    await this.page.goto(`/annonces/${id}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async hasErrorState(): Promise<boolean> {
    const errorState = this.page.locator('.error-state, .error-message');
    return (await errorState.count()) > 0;
  }

  async getErrorMessage(): Promise<string> {
    const errorState = this.page.locator('.error-state .error-message, .error-message');
    return (await errorState.textContent()) || '';
  }

  async hasNotFoundMessage(): Promise<boolean> {
    const errorMsg = await this.getErrorMessage();
    return (
      errorMsg.toLowerCase().includes('introuvable') || errorMsg.toLowerCase().includes('not found')
    );
  }
}

class AnnoncesListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/annonces');
    await this.page.waitForSelector('app-generic-table, app-empty-state, .page-title', {
      timeout: 30000,
    });
  }

  async hasAnnonces(): Promise<boolean> {
    const table = this.page.locator('app-generic-table table tbody tr');
    return (await table.count()) > 0;
  }

  async clickDeleteForFirstAnnonce() {
    const row = this.page.locator('app-generic-table table tbody tr').first();
    const deleteButton = row.locator(
      'button[title*="Supprimer"], button mat-icon:has-text("delete")'
    );
    await deleteButton.first().click();
    await this.page.waitForTimeout(300);
  }
}

test.describe('Error Handling E2E Tests', () => {
  test('Form validation errors: empty required fields show mat-error messages and red borders', async ({
    authenticatedPage: page,
  }) => {
    const createPage = new AnnonceCreatePage(page);

    await createPage.goto();
    await expect(page.locator('h2.page-title')).toContainText('Créer');

    await createPage.clickNextStep();

    expect(await createPage.hasFieldError('title')).toBeTruthy();
    const titleError = await createPage.getFieldError('title');
    expect(titleError.toLowerCase()).toContain('requis');

    expect(await createPage.isFieldInvalid('title')).toBeTruthy();

    expect(await createPage.hasFieldError('category')).toBeTruthy();
    const categoryError = await createPage.getFieldError('category');
    expect(categoryError.toLowerCase()).toContain('requis');
    expect(await createPage.isFieldInvalid('category')).toBeTruthy();

    expect(await createPage.hasFieldError('annonceType')).toBeTruthy();
    const typeError = await createPage.getFieldError('annonceType');
    expect(typeError.toLowerCase()).toContain('requis');
    expect(await createPage.isFieldInvalid('annonceType')).toBeTruthy();

    await createPage.fillTitle('Test Annonce');
    await createPage.fillCategory('APARTMENT');
    await createPage.fillAnnonceType('SALE');

    await page.waitForTimeout(300);

    expect(await createPage.hasFieldError('title')).toBeFalsy();
    expect(await createPage.hasFieldError('category')).toBeFalsy();
    expect(await createPage.hasFieldError('annonceType')).toBeFalsy();
  });

  test('404 Not Found: Navigate to non-existent annonce shows error message', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    await page.route(/\/api\/v1\/annonces\/9999999$/, async (route) => {
      await mockErrorResponse(route, 404, {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: "L'annonce demandée est introuvable",
        instance: '/api/v1/annonces/9999999',
      });
    });

    const detailPage = new AnnonceDetailPage(page);

    const responsePromise = helpers.waitForApiCall(/\/api\/v1\/annonces\/9999999/, {
      expectedStatus: 404,
    });

    await detailPage.goto(9999999);

    const errorResponse = await responsePromise;
    expect(errorResponse.status()).toBe(404);

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 404);

    expect(await detailPage.hasErrorState()).toBeTruthy();
    expect(await detailPage.hasNotFoundMessage()).toBeTruthy();
  });

  test('400 Bad Request: Invalid JSON in rulesJson field shows validation error', async ({
    authenticatedPage: page,
  }) => {
    const createPage = new AnnonceCreatePage(page);

    await createPage.goto();

    await page.locator('#title').fill('Test Invalid JSON');
    await page.locator('#category').selectOption('APARTMENT');
    await page.locator('#annonceType').selectOption('SALE');

    await createPage.clickNextStep();
    await createPage.clickNextStep();
    await createPage.clickNextStep();

    const invalidJson = '{"key": "value", invalid}';
    await page.locator('#rulesJson').fill(invalidJson);
    await page.waitForTimeout(500);

    const jsonError = page.locator('.field-error').filter({ hasText: /JSON|invalide/i });
    await expect(jsonError).toBeVisible({ timeout: 3000 });

    const validJson = '{"allowPets": true}';
    await page.locator('#rulesJson').fill(validJson);
    await page.waitForTimeout(300);

    await expect(jsonError).toHaveCount(0);
  });

  test('403 Forbidden: Unauthorized delete operation shows error snackbar', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    await page.route(/\/api\/v1\/annonces\/\d+$/, async (route) => {
      if (route.request().method() === 'DELETE') {
        await mockErrorResponse(route, 403, {
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: "Vous n'avez pas les droits nécessaires pour supprimer cette annonce",
          instance: route.request().url(),
        });
      } else {
        await route.continue();
      }
    });

    const listPage = new AnnoncesListPage(page);
    await listPage.goto();

    const hasAnnonces = await listPage.hasAnnonces();
    if (!hasAnnonces) {
      test.skip();
      return;
    }

    const errorPromise = helpers.waitForApiCall(/\/api\/v1\/annonces\/\d+/, {
      expectedStatus: 403,
      method: 'DELETE',
    });

    await listPage.clickDeleteForFirstAnnonce();

    const confirmDialog = page.locator('mat-dialog-container');
    if ((await confirmDialog.count()) > 0) {
      const confirmButton = confirmDialog.locator('button:has-text("Supprimer")');
      await confirmButton.click();
    }

    const errorResponse = await errorPromise;
    expect(errorResponse.status()).toBe(403);

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 403);

    await validateErrorSnackbar(page, /droits|forbidden|accès/i);
  });

  test('500 Internal Server Error: Server error shows generic error message', async ({
    authenticatedPage: page,
    helpers,
  }) => {
    await page.route(/\/api\/v1\/annonces$/, async (route) => {
      if (route.request().method() === 'POST') {
        await mockErrorResponse(route, 500, {
          type: 'about:blank',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Une erreur serveur est survenue',
          instance: '/api/v1/annonces',
        });
      } else {
        await route.continue();
      }
    });

    const createPage = new AnnonceCreatePage(page);
    await createPage.goto();

    await page.locator('#title').fill('Test Server Error');
    await page.locator('#category').selectOption('APARTMENT');
    await page.locator('#annonceType').selectOption('SALE');
    await page.locator('#description').fill('Test description');

    await createPage.clickNextStep();
    await createPage.clickNextStep();
    await createPage.clickNextStep();

    const errorPromise = helpers.waitForApiCall(/\/api\/v1\/annonces/, {
      expectedStatus: 500,
      method: 'POST',
    });

    await createPage.clickSubmit();

    const errorResponse = await errorPromise;
    expect(errorResponse.status()).toBe(500);

    const errorBody = await errorResponse.json();
    validateProblemDetails(errorBody, 500);

    await validateErrorSnackbar(page, /erreur|error/i);
  });
});
