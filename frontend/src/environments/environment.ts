export const environment = {
  production: false,
  apiBaseUrl: '/api',
  oidc: {
    enabled: true,
    // Keycloak realm issuer
    issuer: 'http://localhost:8081/realms/myrealm',
    clientId: 'atlas-frontend',
    scope: 'openid profile email',
    requireHttps: false,
    redirectUri: window.location.origin + '/auth/callback'
  }
};
