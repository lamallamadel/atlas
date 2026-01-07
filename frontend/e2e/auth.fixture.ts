import { test as base, expect, Page } from '@playwright/test';

function base64UrlEncode(obj: any): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function buildFakeJwt(orgId = 'ORG-001'): string {
  const header = { alg: 'none', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'e2e-user',
    preferred_username: 'e2e-user',
    scope: 'openid profile email',
    org_id: orgId,
    roles: ['ADMIN'],          // ou ['PRO'] selon ton mapping côté front
    iat: now,
    exp: now + 60 * 60,        // 1h
    iss: 'mock'
  };
  // 3 segments requis; signature vide ok pour votre backend (issuer=mock)
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.`;
}

export async function loginWithMockToken(page: Page, orgId: string): Promise<void> {
  const token = buildFakeJwt(orgId);

  await page.evaluate(({ orgId, token }) => {
    window.localStorage.setItem('org_id', orgId);
    window.localStorage.setItem('auth_mode', 'manual');
    window.localStorage.setItem('auth_token', token);
  }, { orgId, token });

  await page.reload({ waitUntil: 'domcontentloaded' });
}

export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.removeItem('org_id');
    window.localStorage.removeItem('auth_mode');
    window.localStorage.removeItem('auth_token');
  });
}

async function ensureAuthenticated(page: Page) {
  // Va sur l'app d'abord (baseURL doit être configuré dans playwright config)
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // 1) Si déjà authentifié (storageState ou localStorage), on ne fait rien
  const existing = await page.evaluate(() => window.localStorage.getItem('auth_token'));
  if (existing && existing.length > 10) return;

  // 2) Injection directe (mode manual) => pas dépendant de l'écran Mock Login
  const orgId = 'ORG-001';
  const token = buildFakeJwt(orgId);

  await page.evaluate(({ orgId, token }) => {
    window.localStorage.setItem('org_id', orgId);
    window.localStorage.setItem('auth_mode', 'manual');
    window.localStorage.setItem('auth_token', token);
  }, { orgId, token });

  await page.reload({ waitUntil: 'domcontentloaded' });

  // 3) Fallback optionnel : si vous avez encore un écran "Mock Login" dans certains runs
  const orgInput = page.locator('input[placeholder*="ORG-001"]');
  if (await orgInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    await orgInput.fill(orgId);
    await page.locator('button:has-text("Mock Admin Login")').click();
  }

  // Optionnel: une assertion légère pour stabiliser
  // Exemple: si vous avez une sidebar ou un titre dashboard connu :
  // await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
}

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await ensureAuthenticated(page);
    await use(page);
  }
});

export { expect };
