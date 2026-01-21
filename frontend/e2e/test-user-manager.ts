import { Page } from '@playwright/test';

export interface TestUser {
  id: string;
  username: string;
  orgId: string;
  roles: string[];
  token: string;
}

export class TestUserManager {
  private createdUsers: TestUser[] = [];
  
  constructor(private page: Page) {}

  private base64UrlEncode(obj: any): string {
    const json = JSON.stringify(obj);
    return Buffer.from(json)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private buildFakeJwt(username: string, orgId: string, roles: string[] = ['ADMIN']): string {
    const header = { alg: 'none', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: username,
      preferred_username: username,
      scope: 'openid profile email',
      org_id: orgId,
      roles: roles,
      iat: now,
      exp: now + 60 * 60,
      iss: 'mock',
    };
    return `${this.base64UrlEncode(header)}.${this.base64UrlEncode(payload)}.`;
  }

  async createTestUser(options?: {
    username?: string;
    orgId?: string;
    roles?: string[];
  }): Promise<TestUser> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    
    const user: TestUser = {
      id: `test-user-${timestamp}-${random}`,
      username: options?.username || `e2e-user-${timestamp}`,
      orgId: options?.orgId || `ORG-${timestamp}`,
      roles: options?.roles || ['ADMIN'],
      token: '',
    };

    user.token = this.buildFakeJwt(user.username, user.orgId, user.roles);
    this.createdUsers.push(user);

    return user;
  }

  async loginAsUser(user: TestUser): Promise<void> {
    await this.page.evaluate(
      ({ orgId, token, username }) => {
        window.localStorage.setItem('org_id', orgId);
        window.localStorage.setItem('auth_mode', 'manual');
        window.localStorage.setItem('auth_token', token);
        window.localStorage.setItem('username', username);
      },
      { orgId: user.orgId, token: user.token, username: user.username }
    );

    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  async setupTestUser(options?: {
    username?: string;
    orgId?: string;
    roles?: string[];
  }): Promise<TestUser> {
    const user = await this.createTestUser(options);
    await this.loginAsUser(user);
    return user;
  }

  async logout(): Promise<void> {
    await this.page.evaluate(() => {
      window.localStorage.removeItem('org_id');
      window.localStorage.removeItem('auth_mode');
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('username');
    });
  }

  async cleanupAllUsers(): Promise<void> {
    await this.logout();
    this.createdUsers = [];
  }

  getCreatedUsers(): TestUser[] {
    return [...this.createdUsers];
  }

  async switchToUser(user: TestUser): Promise<void> {
    await this.loginAsUser(user);
  }

  async getCurrentUser(): Promise<TestUser | null> {
    const stored = await this.page.evaluate(() => {
      const orgId = window.localStorage.getItem('org_id');
      const token = window.localStorage.getItem('auth_token');
      const username = window.localStorage.getItem('username');
      
      return { orgId, token, username };
    });

    if (!stored.orgId || !stored.token) {
      return null;
    }

    const matchingUser = this.createdUsers.find(
      (u) => u.orgId === stored.orgId && u.token === stored.token
    );

    return matchingUser || null;
  }
}

export async function createTestUserManager(page: Page): Promise<TestUserManager> {
  return new TestUserManager(page);
}
