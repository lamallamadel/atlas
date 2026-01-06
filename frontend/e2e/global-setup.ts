import { promises as fs } from 'fs';
import * as path from 'path';

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generates a lightweight, unsigned JWT-like token (3 segments) suitable for the
 * frontend manual auth mode and for the backend 'issuer-uri=mock' decoder.
 */
function buildMockJwt(expiresInSeconds: number = 60 * 60): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    sub: 'e2e-user',
    preferred_username: 'e2e-user',
    iat: now,
    exp: now + expiresInSeconds,
    roles: ['ADMIN'],
    realm_access: { roles: ['ADMIN'] },
  };

  const h = base64UrlEncode(JSON.stringify(header));
  const p = base64UrlEncode(JSON.stringify(payload));
  // Third segment must exist; signature is irrelevant for 'alg=none' style token here.
  return `${h}.${p}.x`;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Global setup for "fast" E2E runs.
 *
 * Writes a Playwright storageState file that pre-populates localStorage with:
 * - auth_token
 * - auth_mode=manual
 * - org_id
 */
export default async function globalSetup(): Promise<void> {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200';
  const orgId = process.env.E2E_ORG_ID || 'ORG-001';
  const token = process.env.E2E_TOKEN || buildMockJwt(2 * 60 * 60);

  const authDir = path.resolve(__dirname, '.auth');
  const storageStatePath = path.resolve(authDir, 'storageState.json');
  await ensureDir(authDir);

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: baseURL,
        localStorage: [
          { name: 'auth_token', value: token },
          { name: 'auth_mode', value: 'manual' },
          { name: 'org_id', value: orgId },
        ],
      },
    ],
  };

  await fs.writeFile(storageStatePath, JSON.stringify(storageState, null, 2), 'utf-8');
}
