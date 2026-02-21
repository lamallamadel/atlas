export const environment = {
  production: false,
  apiBaseUrl: '/api',
  vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  oidc: {
    enabled: true,
    // Keycloak realm issuer
    issuer: 'http://localhost:8081/realms/myrealm',
    clientId: 'atlas-frontend',
    scope: 'openid profile email',
    requireHttps: false,
    redirectUri: window.location.origin + '/auth/callback',
    logoutRedirectUri: window.location.origin + '/login'
  }
};
