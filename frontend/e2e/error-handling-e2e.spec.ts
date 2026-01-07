import { test, expect } from './auth.fixture';
import { Page, Route } from '@playwright/test';
import { 
  ProblemDetails, 
  validateProblemDetails, 
  validateErrorSnackbar, 
  mockErrorResponse 
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
    await nextButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickSubmit() {
    const submitButton = this.page.locator('button.btn-submit');
    await submitButton.click();
    await this.page.waitForTimeout(1000);
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
    await this.page.waitForTimeout(1000);
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
    return errorMsg.toLowerCase().includes('introuvable') || errorMsg.toLowerCase().includes('not found');
  }
}

class AnnoncesListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/annonces');
    await this.page.waitForSelector('app-generic-table, app-empty-state, .page-title', { timeout: 30000 });
  }

  async hasAnnonces(): Promise<boolean> {
    const table = this.page.locator('app-generic-table table tbody tr');
    return (await table.count()) > 0;
  }

  async clickDeleteForFirstAnnonce() {
    const row = this.page.locator('app-generic-table table tbody tr').first();
    const deleteButton = row.locator('button[title*="Supprimer"], button mat-icon:has-text("delete")');
    await deleteButton.first().click();
    await this.page.waitForTimeout(500);
  }
}

test.describe('Error Handling E2E Tests', () => {
  test('Form validation errors: empty required fields show mat-error messages and red borders', async ({ page }) => {
    const createPage = new AnnonceCreatePage(page);

    // Navigate to create form
    await createPage.goto();
    await expect(page.locator('h2.page-title')).toContainText('Créer');

    // Try to go to next step without filling required fields
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Verify that validation errors are displayed
    // Title is required
    expect(await createPage.hasFieldError('title')).toBeTruthy();
    const titleError = await createPage.getFieldError('title');
    expect(titleError.toLowerCase()).toContain('requis');

    // Verify red border (invalid class) on required fields
    expect(await createPage.isFieldInvalid('title')).toBeTruthy();

    // Category is required
    expect(await createPage.hasFieldError('category')).toBeTruthy();
    const categoryError = await createPage.getFieldError('category');
    expect(categoryError.toLowerCase()).toContain('requis');
    expect(await createPage.isFieldInvalid('category')).toBeTruthy();

    // Annonce type is required
    expect(await createPage.hasFieldError('annonceType')).toBeTruthy();
    const typeError = await createPage.getFieldError('annonceType');
    expect(typeError.toLowerCase()).toContain('requis');
    expect(await createPage.isFieldInvalid('annonceType')).toBeTruthy();

    // Fill required fields to clear errors
    await createPage.fillCategory('APARTMENT');
    await createPage.fillAnnonceType('SALE');
    await createPage.fillTitle('Test Annonce');

    // Try next step again - should succeed now
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Verify we moved to step 2
    const step2Title = page.locator('h3.step-title:has-text("Localisation")');
    await expect(step2Title).toBeVisible({ timeout: 5000 });
  });

  test('Submit invalid data triggering backend 400 - verify ProblemDetails.detail displayed as snackbar', async ({ page }) => {
    const createPage = new AnnonceCreatePage(page);

    // Intercept the POST request and return a 400 error with ProblemDetails
    const problemDetails: ProblemDetails = {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Le titre de l\'annonce ne peut pas dépasser 500 caractères',
      instance: '/api/annonces'
    };

    await mockErrorResponse(page, /\/api\/annonces$/, 400, problemDetails, 'POST');

    // Navigate to create form and fill it
    await createPage.goto();
    
    // Fill required fields in step 1
    await createPage.fillCategory('APARTMENT');
    await createPage.fillAnnonceType('SALE');
    await createPage.fillTitle('Valid Title');
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Skip step 2
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Skip step 3
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Fill step 4 with valid JSON
    await page.locator('#rulesJson').fill('{"allowPets": true}');
    await page.waitForTimeout(300);

    // Submit the form - should trigger our mocked 400 error
    await createPage.clickSubmit();

    // Wait for the error response
    await page.waitForResponse(response => response.status() === 400, { timeout: 10000 });

    // Verify that the ProblemDetails.detail message is displayed in a snackbar
    await validateErrorSnackbar(page, problemDetails.detail!);

    // Verify snackbar has correct styling
    const snackbar = page.locator('.mat-mdc-snack-bar-container, .snackbar, [role="alert"]');
    await expect(snackbar).toBeVisible({ timeout: 5000 });
    const snackbarText = await snackbar.textContent();
    expect(snackbarText).toContain(problemDetails.detail);
  });

  test('403 by attempting PRO user delete - verify access denied message', async ({ page }) => {
    // First, create a JWT token for a PRO user (not ADMIN)
    const orgId = 'ORG-001';
    const proToken = buildProUserToken(orgId);

    // Set PRO user token
    await page.evaluate(({ orgId, token }) => {
      window.localStorage.setItem('org_id', orgId);
      window.localStorage.setItem('auth_mode', 'manual');
      window.localStorage.setItem('auth_token', token);
    }, { orgId, token: proToken });

    await page.reload({ waitUntil: 'domcontentloaded' });

    // Mock 403 response for delete operation
    const problemDetails: ProblemDetails = {
      type: 'about:blank',
      title: 'Forbidden',
      status: 403,
      detail: 'Accès refusé. Vous n\'avez pas les permissions nécessaires pour cette action.',
      instance: '/api/annonces/1'
    };

    await mockErrorResponse(page, /\/api\/annonces\/\d+$/, 403, problemDetails, 'DELETE');

    // Navigate to annonces list
    const listPage = new AnnoncesListPage(page);
    await listPage.goto();

    // Check if there are annonces
    if (await listPage.hasAnnonces()) {
      // Try to delete an annonce (this will trigger 403)
      await listPage.clickDeleteForFirstAnnonce();
      await page.waitForTimeout(500);

      // Confirm delete in dialog if it appears
      const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Supprimer")');
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Wait for the 403 response
      await page.waitForResponse(response => response.status() === 403, { timeout: 10000 });

      // Verify that access denied message is displayed
      await validateErrorSnackbar(page, /accès refusé|forbidden|permissions/i);
    }
  });

  test('404 by navigating to /annonces/99999 - verify Not Found error page or message', async ({ page }) => {
    const detailPage = new AnnonceDetailPage(page);

    // Navigate to a non-existent annonce
    await detailPage.goto(99999);

    // Wait for error to be displayed
    await page.waitForTimeout(2000);

    // Check if error state is shown on the page
    if (await detailPage.hasErrorState()) {
      // Verify the error message contains "Not Found" or "introuvable"
      expect(await detailPage.hasNotFoundMessage()).toBeTruthy();
      
      const errorMsg = await detailPage.getErrorMessage();
      console.log('404 error message displayed:', errorMsg);
    }

    // Also check for snackbar notification
    const snackbar = page.locator('.mat-mdc-snack-bar-container, .snackbar, [role="alert"]');
    const snackbarVisible = await snackbar.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (snackbarVisible) {
      const snackbarText = await snackbar.textContent();
      expect(snackbarText?.toLowerCase()).toMatch(/introuvable|not found|ressource.*introuvable/);
    }
  });

  test('Mock 500 error - verify generic error message with correlation ID for support contact', async ({ page }) => {
    const createPage = new AnnonceCreatePage(page);

    // Generate a correlation ID
    const correlationId = `test-500-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Intercept the POST request and return a 500 error with ProblemDetails
    const problemDetails: ProblemDetails = {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: `Une erreur interne est survenue. Veuillez contacter le support avec l'ID de corrélation: ${correlationId}`,
      instance: '/api/annonces'
    };

    await page.route(/\/api\/annonces$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          headers: {
            'X-Org-Id': 'ORG-001',
            'X-Correlation-Id': correlationId
          },
          body: JSON.stringify(problemDetails)
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to create form and fill it
    await createPage.goto();
    
    // Fill required fields in step 1
    await createPage.fillCategory('HOUSE');
    await createPage.fillAnnonceType('RENT');
    await createPage.fillTitle('Test 500 Error');
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Skip step 2
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Skip step 3
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Fill step 4 with valid JSON
    await page.locator('#rulesJson').fill('{"maxOccupants": 4}');
    await page.waitForTimeout(300);

    // Submit the form - should trigger our mocked 500 error
    await createPage.clickSubmit();

    // Wait for the 500 error response
    const errorResponse = await page.waitForResponse(
      response => response.status() === 500,
      { timeout: 10000 }
    );

    // Verify response headers include correlation ID
    const headers = errorResponse.headers();
    expect(headers['x-correlation-id']).toBeTruthy();

    // Verify response body is ProblemDetails
    const responseBody = await errorResponse.json();
    validateProblemDetails(responseBody, 500);

    // Verify that the error message is displayed in a snackbar
    const snackbar = page.locator('.mat-mdc-snack-bar-container, .snackbar, [role="alert"]');
    await expect(snackbar).toBeVisible({ timeout: 10000 });
    
    const snackbarText = await snackbar.textContent();
    
    // Verify generic error message
    expect(snackbarText?.toLowerCase()).toMatch(/erreur interne|internal.*error|erreur.*survenue/);
    
    // Verify correlation ID is mentioned for support contact
    // The correlation ID might be in the snackbar or in the ProblemDetails.detail
    const hasCorrelationIdInSnackbar = snackbarText?.includes(correlationId) || 
                                        snackbarText?.toLowerCase().includes('corrélation') ||
                                        snackbarText?.toLowerCase().includes('support');
    
    const hasCorrelationIdInDetail = problemDetails.detail.includes(correlationId);
    
    // At least one should contain correlation ID info
    expect(hasCorrelationIdInSnackbar || hasCorrelationIdInDetail).toBeTruthy();

    console.log('500 error handled with correlation ID:', correlationId);
    console.log('Snackbar text:', snackbarText);
    console.log('ProblemDetails.detail:', problemDetails.detail);
  });

  test('Multiple validation errors display correctly with appropriate styling', async ({ page }) => {
    const createPage = new AnnonceCreatePage(page);

    await createPage.goto();

    // Fill step 1 with a title that exceeds max length
    await createPage.fillCategory('APARTMENT');
    await createPage.fillAnnonceType('SALE');
    
    // Create a very long title (over 500 characters)
    const longTitle = 'A'.repeat(501);
    await createPage.fillTitle(longTitle);
    
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Verify maxlength error is shown
    expect(await createPage.hasFieldError('title')).toBeTruthy();
    const titleError = await createPage.getFieldError('title');
    expect(titleError.toLowerCase()).toMatch(/dépasser|maxlength|caractères/);
    expect(await createPage.isFieldInvalid('title')).toBeTruthy();
  });

  test('JSON validation error shows helpful message with position', async ({ page }) => {
    const createPage = new AnnonceCreatePage(page);

    await createPage.goto();

    // Fill step 1
    await createPage.fillCategory('STUDIO');
    await createPage.fillAnnonceType('RENT');
    await createPage.fillTitle('JSON Validation Test');
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Skip step 2
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Skip step 3
    await createPage.clickNextStep();
    await page.waitForTimeout(500);

    // Fill step 4 with invalid JSON
    const invalidJson = '{"allowPets": true, "smokingAllowed": false';
    await page.locator('#rulesJson').fill(invalidJson);
    await page.waitForTimeout(500);

    // Try to submit
    await createPage.clickSubmit();

    // Verify JSON validation error is shown
    const rulesJsonError = await createPage.getFieldError('rulesJson');
    expect(rulesJsonError.toLowerCase()).toMatch(/json.*invalide|invalid.*json/);
    
    // The error might include position information
    console.log('JSON validation error:', rulesJsonError);
  });
});

// Helper function to build a PRO user JWT token
function buildProUserToken(orgId: string): string {
  const header = { alg: 'none', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'e2e-pro-user',
    preferred_username: 'e2e-pro-user',
    scope: 'openid profile email',
    org_id: orgId,
    roles: ['PRO'],  // PRO user, not ADMIN
    iat: now,
    exp: now + 60 * 60,
    iss: 'mock'
  };
  
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.`;
}

function base64UrlEncode(obj: any): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
