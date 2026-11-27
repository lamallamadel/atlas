import { DemoAccount } from './demo-accounts';
import { encodeBase64Url } from '../../utils/base64url';

/**
 * Jeton « mock-demo-<en-tête>.<charge utile>.demo » : le backend en mode mock lit sub, rôles et
 * org_id dans la charge utile (SecurityConfig.demoJwt). Refusé par un backend relié à Keycloak.
 */
export function demoToken(account: DemoAccount, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    sub: account.sub,
    name: account.name,
    preferred_username: account.sub,
    email: account.email,
    org_id: account.orgId,
    roles: account.roles,
    realm_access: { roles: account.roles },
    iat: nowSeconds,
    exp: nowSeconds + 8 * 3600,
  };
  return `mock-demo-${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}.demo`;
}

/** Page d'arrivée selon le profil. */
export function demoLanding(account: DemoAccount): string {
  if (account.roles.includes('OWNER')) return '/proprietaire';
  if (account.roles.includes('SUPER_ADMIN')) return '/pro/moderation';
  return '/dashboard';
}
