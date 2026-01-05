import { test as base, Page } from '@playwright/test';

export interface AuthenticatedPage {
  page: Page;
}

async function authenticateUser(page: Page): Promise<void> {
  await page.goto('/login');
  
  const orgIdInput = page.locator('input[placeholder*="ID Organisation"]');
  await orgIdInput.fill('ORG-001');
  
  const mockLoginButton = page.locator('button:has-text("Mock Login")');
  await mockLoginButton.click();
  
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export const test = base.extend<AuthenticatedPage>({
  page: async ({ page }, use) => {
    await authenticateUser(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
