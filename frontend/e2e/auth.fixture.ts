import { test as base, expect, Page } from '@playwright/test';
import { TestUserManager } from './test-user-manager';

function base64UrlEncode(obj: any): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json).toString('base64')
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
    iss: 'mock'
  };
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.`;
}

export async function loginWithMockToken(page: Page, orgId: string, username?: string): Promise<void> {
  const token = buildFakeJwt(orgId, username);

  await page.evaluate(({ orgId, token, username }) => {
    window.localStorage.setItem('org_id', orgId);
    window.localStorage.setItem('auth_mode', 'manual');
    window.localStorage.setItem('auth_token', token);
    if (username) {
      window.localStorage.setItem('username', username);
    }
  }, { orgId, token, username: username || 'e2e-user' });

  await page.reload({ waitUntil: 'domcontentloaded' });
}

export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.removeItem('org_id');
    window.localStorage.removeItem('auth_mode');
    window.localStorage.removeItem('auth_token');
    window.localStorage.removeItem('username');
  });
}

async function ensureAuthenticated(page: Page, testInfo?: any) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const existing = await page.evaluate(() => window.localStorage.getItem('auth_token'));
  if (existing && existing.length > 10) return;

  const testId = testInfo?.testId || 'default';
  const sanitizedId = testId.replace(/[^a-zA-Z0-9]/g, '-');
  const timestamp = Date.now();
  
  const orgId = `ORG-${sanitizedId}-${timestamp}`;
  const username = `e2e-user-${timestamp}`;
  const token = buildFakeJwt(orgId, username);

  await page.evaluate(({ orgId, token, username }) => {
    window.localStorage.setItem('org_id', orgId);
    window.localStorage.setItem('auth_mode', 'manual');
    window.localStorage.setItem('auth_token', token);
    window.localStorage.setItem('username', username);
  }, { orgId, token, username });

  await page.reload({ waitUntil: 'domcontentloaded' });

  const orgInput = page.locator('input[placeholder*="ORG-001"]');
  if (await orgInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    await orgInput.fill(orgId);
    await page.locator('button:has-text("Mock Admin Login")').click();
  }

  await page.waitForSelector(
    'app-root, [data-testid="app-loaded"], .dashboard, .main-content',
    { timeout: 15000 }
  ).catch(() => {
    console.warn('App root element not found, continuing anyway');
  });
}

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use, testInfo) => {
    await ensureAuthenticated(page, testInfo);
    await use(page);
    await logout(page);
  }
});

export { expect };
