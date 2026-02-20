export const environment = {
  production: true,
  apiBaseUrl: '/api',
  oidc: {
    enabled: true,
    issuer: 'https://identity.afroware.app/realms/myrealm',
    clientId: 'atlas-frontend',
    scope: 'openid profile email',
    requireHttps: true,
    redirectUri: (typeof window !== 'undefined' ? window.location.origin : '') + '/auth/callback'
  }
};
