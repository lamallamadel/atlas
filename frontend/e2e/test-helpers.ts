import { Page, Locator, expect } from '@playwright/test';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  timeout?: number;
}

export interface WaitForSelectorOptions {
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 500,
  backoffMultiplier: 2,
  timeout: 30000,
};

export class TestHelpers {
  constructor(private page: Page) {}

  async retryAssertion<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error | undefined;
    let delay = opts.delayMs;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === opts.maxAttempts) {
          throw new Error(
            `Assertion failed after ${opts.maxAttempts} attempts. Last error: ${lastError.message}`
          );
        }

        await this.page.waitForTimeout(delay);
        delay *= opts.backoffMultiplier;
      }
    }

    throw lastError!;
  }

  async waitForSelector(
    selector: string,
    options: WaitForSelectorOptions = {}
  ): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({
      state: options.state || 'visible',
      timeout: options.timeout || 30000,
    });
    return locator;
  }

  async waitForResponse(
    urlPattern: string | RegExp,
    options: { timeout?: number; expectedStatus?: number } = {}
  ): Promise<any> {
    const timeout = options.timeout || 30000;

    const response = await this.page.waitForResponse(
      (resp) => {
        const urlMatches =
          typeof urlPattern === 'string'
            ? resp.url().includes(urlPattern)
            : urlPattern.test(resp.url());

        if (!urlMatches) return false;

        if (options.expectedStatus) {
          return resp.status() === options.expectedStatus;
        }

        return true;
      },
      { timeout }
    );

    return response;
  }

  async waitForApiResponse(
    urlPattern: string | RegExp,
    options: { timeout?: number; expectedStatus?: number } = {}
  ): Promise<{ response: any; body: any }> {
    const response = await this.waitForResponse(urlPattern, options);
    const body = await response.json().catch(() => null);

    return { response, body };
  }

  async navigateToDossiers(): Promise<void> {
    const dossiersLink = this.page.locator('a[href="/dossiers"], button:has-text("Dossiers")');

    await this.retryAssertion(async () => {
      await dossiersLink.first().click();
      await this.page.waitForURL(/.*dossiers/, { timeout: 10000 });
    });

    await this.waitForSelector(
      'app-generic-table, app-empty-state, table.data-table, .dossier-card, .empty-message, .empty-state-message',
      { timeout: 30000 }
    );
  }

  async navigateToAnnonces(): Promise<void> {
    const annoncesLink = this.page.locator('a[href="/annonces"], button:has-text("Annonces")');

    await this.retryAssertion(async () => {
      await annoncesLink.first().click();
      await this.page.waitForURL(/.*annonces/, { timeout: 10000 });
    });

    await this.waitForSelector(
      'app-generic-table, app-empty-state, table.data-table, .empty-message, .empty-state-message',
      { timeout: 30000 }
    );
  }

  async switchToTab(tabName: string): Promise<void> {
    const tab = this.page.locator(
      `div.mat-mdc-tab-label-content:has-text("${tabName}"), .mat-tab-label:has-text("${tabName}")`
    );

    await this.retryAssertion(async () => {
      await tab.click();
      await this.page.waitForTimeout(500);
    });

    await this.page
      .locator(`div.mat-mdc-tab-label-content:has-text("${tabName}")[aria-selected="true"]`)
      .waitFor({ timeout: 5000 })
      .catch(() => {
        console.warn(`Tab "${tabName}" may not have aria-selected attribute`);
      });
  }

  async waitForDialog(): Promise<void> {
    await this.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });
  }

  async closeDialog(): Promise<void> {
    const closeButton = this.page.locator(
      'mat-dialog-container button[mat-dialog-close], mat-dialog-container .close-button'
    );
    const hasCloseButton = (await closeButton.count()) > 0;

    if (hasCloseButton) {
      await closeButton.first().click();
      await this.page.waitForTimeout(500);
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  async closeSnackbar(): Promise<void> {
    const snackbar = this.page.locator('.mat-mdc-snack-bar-container, .snackbar');

    try {
      await snackbar.waitFor({ state: 'visible', timeout: 2000 });

      const closeButton = snackbar.locator('button');
      const hasCloseButton = (await closeButton.count()) > 0;

      if (hasCloseButton) {
        await closeButton.click();
        await snackbar.waitFor({ state: 'hidden', timeout: 3000 });
      } else {
        await snackbar.waitFor({ state: 'hidden', timeout: 5000 });
      }
    } catch {
      // Snackbar not present or already closed
    }
  }

  formatDateTimeLocal(date: Date): string {
    return date.toISOString().substring(0, 16);
  }

  extractDossierId(url: string): string | null {
    const match = url.match(/dossiers\/(\d+)/);
    return match ? match[1] : null;
  }

  extractAnnonceId(url: string): string | null {
    const match = url.match(/annonces\/(\d+)/);
    return match ? match[1] : null;
  }

  async takeScreenshotOnFailure(testName: string, error: Error): Promise<void> {
    const sanitizedName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `failure-${sanitizedName}-${timestamp}.png`;

    try {
      await this.page.screenshot({
        path: `test-results/screenshots/${filename}`,
        fullPage: true,
      });

      console.error(`Screenshot saved: ${filename}`);
      console.error(`Error context: ${error.message}`);
      console.error(`Current URL: ${this.page.url()}`);
      console.error(`Page title: ${await this.page.title()}`);
    } catch (screenshotError) {
      console.error(`Failed to take screenshot: ${screenshotError}`);
    }
  }

  async ensureDossierExists(leadName: string, leadPhone: string): Promise<string> {
    const dossierLink = this.page.locator('table.data-table tbody tr').first();
    const hasDossiers = (await dossierLink.count()) > 0;

    if (!hasDossiers) {
      const createButton = this.page.locator('button:has-text("Créer"), button:has-text("Nouveau")');

      await this.retryAssertion(async () => {
        await createButton.first().click();
      });

      await this.waitForDialog();

      await this.page.locator('input#leadName, input[name="leadName"]').fill(leadName);
      await this.page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

      const submitButton = this.page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.waitFor({ state: 'visible' });

      const responsePromise = this.waitForApiResponse(/\/api\/v1\/dossiers$/, {
        expectedStatus: 201,
      });

      await submitButton.click();

      await this.retryAssertion(async () => {
        await this.page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      });

      const { body } = await responsePromise;
      return body?.id?.toString() || this.extractDossierId(this.page.url()) || '';
    } else {
      const responsePromise = this.waitForApiResponse(/\/api\/v1\/dossiers\/\d+$/, {
        expectedStatus: 200,
      });

      await dossierLink.click();
      await this.page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });

      const { body } = await responsePromise;
      return body?.id?.toString() || this.extractDossierId(this.page.url()) || '';
    }
  }

  async retryOperation<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    return this.retryAssertion(operation, options);
  }

  async fillFormField(selector: string, value: string): Promise<void> {
    const field = this.page.locator(selector);
    await field.waitFor({ state: 'visible', timeout: 5000 });
    await field.clear();
    await field.fill(value);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    const select = this.page.locator(selector);
    await select.waitFor({ state: 'visible', timeout: 5000 });
    await select.selectOption(value);
  }

  async clickButton(selector: string): Promise<void> {
    const button = this.page.locator(selector);
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
  }

  async waitForNavigation(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: 15000 });
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load'): Promise<void> {
    await this.page.waitForLoadState(state, { timeout: 30000 });
  }

  async isElementVisible(selector: string, timeout = 1000): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async getElementText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: 5000 });
    return (await element.textContent()) || '';
  }

  async waitForApiCall(
    urlPattern: string | RegExp,
    options: {
      method?: string;
      timeout?: number;
      expectedStatus?: number;
    } = {}
  ): Promise<any> {
    const timeout = options.timeout || 30000;
    const method = options.method?.toUpperCase();

    const response = await this.page.waitForResponse(
      (resp) => {
        const urlMatches =
          typeof urlPattern === 'string'
            ? resp.url().includes(urlPattern)
            : urlPattern.test(resp.url());

        if (!urlMatches) return false;

        if (method && resp.request().method() !== method) return false;

        if (options.expectedStatus && resp.status() !== options.expectedStatus) return false;

        return true;
      },
      { timeout }
    );

    return response;
  }
}

export async function navigateToDossiers(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.navigateToDossiers();
}

export async function navigateToAnnonces(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.navigateToAnnonces();
}

export async function switchToTab(page: Page, tabName: string): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.switchToTab(tabName);
}

export async function waitForDialog(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.waitForDialog();
}

export async function closeSnackbar(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.closeSnackbar();
}

export function formatDateTimeLocal(date: Date): string {
  return date.toISOString().substring(0, 16);
}

export function extractDossierId(url: string): string | null {
  const match = url.match(/dossiers\/(\d+)/);
  return match ? match[1] : null;
}

export function extractAnnonceId(url: string): string | null {
  const match = url.match(/annonces\/(\d+)/);
  return match ? match[1] : null;
}

export async function ensureDossierExists(
  page: Page,
  leadName: string,
  leadPhone: string
): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.ensureDossierExists(leadName, leadPhone);
}
