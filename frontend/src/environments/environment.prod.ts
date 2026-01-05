export const environment = {
  production: true,
  apiBaseUrl: '/api',
  oidc: {
    enabled: true,
    issuer: 'http://localhost:8081/realms/myrealm',
    clientId: 'atlas-frontend',
    scope: 'openid profile email',
    requireHttps: false,
    redirectUri: (typeof window !== 'undefined' ? window.location.origin : '') + '/auth/callback'
  }
};
