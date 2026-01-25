import { test as base, expect, Page } from '@playwright/test';
import { TestUserManager } from './test-user-manager';
import { TestDataCleanup } from './test-data-cleanup';
import { TestHelpers } from './test-helpers';

function base64UrlEncode(obj: any): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function buildFakeJwt(orgId = 'ORG-001', username = 'e2e-user'): string {
  const header = { alg: 'none', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: username,
    preferred_username: username,
    scope: 'openid profile email',
    org_id: orgId,
    roles: ['ADMIN'],
    iat: now,
    exp: now + 60 * 60,
    iss: 'mock',
  };
  return `mock-${base64UrlEncode(header)}.${base64UrlEncode(payload)}.`;
}

interface StableTestFixtures {
  authenticatedPage: Page;
  testUser: TestUserManager;
  cleanup: TestDataCleanup;
  helpers: TestHelpers;
}

export const test = base.extend<StableTestFixtures>({
  authenticatedPage: async ({ page }, use, testInfo) => {
    const testId = testInfo.testId || 'default';
    const sanitizedId = testId.replace(/[^a-zA-Z0-9]/g, '-');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);

    const orgId = `ORG-${sanitizedId}-${timestamp}-${random}`;
    const username = `e2e-user-${timestamp}-${random}`;
    const token = buildFakeJwt(orgId, username);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.evaluate(
      ({ orgId, token, username }) => {
        window.localStorage.setItem('org_id', orgId);
        window.localStorage.setItem('auth_mode', 'manual');
        window.localStorage.setItem('auth_token', token);
        window.localStorage.setItem('username', username);
      },
      { orgId, token, username }
    );

    await page.reload({ waitUntil: 'domcontentloaded' });

    const orgInput = page.locator('input[placeholder*="ORG-001"]');
    const hasOrgInput = await orgInput.isVisible({ timeout: 1500 }).catch(() => false);
    
    if (hasOrgInput) {
      await orgInput.fill(orgId);
      await page.locator('button:has-text("Mock Admin Login")').click();
    }

    await page
      .waitForSelector('app-root, [data-testid="app-loaded"], .dashboard, .main-content', {
        timeout: 15000,
      })
      .catch(() => {
        console.warn('App root element not found, continuing anyway');
      });

    await use(page);

    await page.evaluate(() => {
      window.localStorage.removeItem('org_id');
      window.localStorage.removeItem('auth_mode');
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('username');
    });
  },

  testUser: async ({ authenticatedPage }, use) => {
    const userManager = new TestUserManager(authenticatedPage);
    await use(userManager);
    await userManager.cleanupAllUsers();
  },

  cleanup: async ({ authenticatedPage }, use, testInfo) => {
    const cleanupManager = new TestDataCleanup(authenticatedPage);
    
    await use(cleanupManager);

    try {
      await cleanupManager.fullCleanup();
    } catch (error) {
      console.warn(`Cleanup failed for test ${testInfo.title}:`, error);
    }
  },

  helpers: async ({ authenticatedPage }, use, testInfo) => {
    const helpers = new TestHelpers(authenticatedPage);
    
    await use(helpers);
  },
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const sanitizedName = testInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `failure-${sanitizedName}-${timestamp}.png`;

    try {
      await page.screenshot({
        path: `test-results/screenshots/${filename}`,
        fullPage: true,
      });

      console.error(`❌ Test Failed: ${testInfo.title}`);
      console.error(`📸 Screenshot: ${filename}`);
      console.error(`🔗 URL: ${page.url()}`);
      console.error(`📄 Page Title: ${await page.title().catch(() => 'N/A')}`);
      console.error(`⚠️  Error: ${testInfo.error?.message || 'Unknown error'}`);
      console.error(`📚 Stack: ${testInfo.error?.stack || 'No stack trace'}`);
    } catch (screenshotError) {
      console.error(`Failed to capture failure context: ${screenshotError}`);
    }
  }
});

export { expect };
