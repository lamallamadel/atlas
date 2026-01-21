import { test as base, Page } from '@playwright/test';
import { TestUserManager } from './test-user-manager';
import { TestDataCleanup } from './test-data-cleanup';
import { TestHelpers } from './test-helpers';

export interface StableTestFixtures {
  page: Page;
  userManager: TestUserManager;
  dataCleanup: TestDataCleanup;
  helpers: TestHelpers;
}

export const test = base.extend<StableTestFixtures>({
  page: async ({ page }, use, testInfo) => {
    const userManager = new TestUserManager(page);
    const helpers = new TestHelpers(page);

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const existingToken = await page.evaluate(() => 
        window.localStorage.getItem('auth_token')
      );

      if (!existingToken || existingToken.length < 10) {
        const testUser = await userManager.setupTestUser({
          orgId: `ORG-${testInfo.testId.replace(/[^a-zA-Z0-9]/g, '-')}`,
        });
        
        console.log(`Created test user: ${testUser.username} for org: ${testUser.orgId}`);
      }

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      await helpers.retryAssertion(async () => {
        await page.waitForSelector(
          'app-root, [data-testid="app-loaded"], .dashboard, .main-content',
          { timeout: 15000 }
        );
      });

      await use(page);
    } catch (error) {
      await helpers.takeScreenshotOnFailure(testInfo.title, error as Error);
      throw error;
    } finally {
      await userManager.cleanupAllUsers();
    }
  },

  userManager: async ({ page }, use) => {
    const userManager = new TestUserManager(page);
    await use(userManager);
    await userManager.cleanupAllUsers();
  },

  dataCleanup: async ({ page }, use) => {
    const cleanup = new TestDataCleanup(page);
    await use(cleanup);
    await cleanup.fullCleanup();
  },

  helpers: async ({ page }, use) => {
    const helpers = new TestHelpers(page);
    await use(helpers);
  },
});

export { expect } from '@playwright/test';
