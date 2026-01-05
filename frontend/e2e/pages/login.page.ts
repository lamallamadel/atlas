import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly orgIdInput: Locator;
  readonly mockLoginButton: Locator;
  readonly mockAdminLoginButton: Locator;
  readonly keycloakLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orgIdInput = page.locator('input[placeholder*="ID Organisation"]');
    this.mockLoginButton = page.locator('button:has-text("Mock Login")');
    this.mockAdminLoginButton = page.locator('button:has-text("Mock Admin Login")');
    this.keycloakLoginButton = page.locator('button:has-text("Connexion via Keycloak")');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async loginWithMock(orgId: string = 'ORG-001') {
    await this.orgIdInput.fill(orgId);
    await this.mockLoginButton.click();
    await this.page.waitForURL('/dashboard', { timeout: 10000 });
  }

  async loginAsAdmin(orgId: string = 'ORG-001') {
    await this.orgIdInput.fill(orgId);
    await this.mockAdminLoginButton.click();
    await this.page.waitForURL('/dashboard', { timeout: 10000 });
  }
}
