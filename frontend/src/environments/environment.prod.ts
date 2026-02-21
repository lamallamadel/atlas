export const environment = {
  production: true,
  apiBaseUrl: '/api',
  vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  oidc: {
    enabled: true,
    issuer: 'https://identity.afroware.app/realms/myrealm',
    clientId: 'atlas-frontend',
    scope: 'openid profile email',
    requireHttps: true,
    redirectUri: (typeof window !== 'undefined' ? window.location.origin : '') + '/auth/callback'
  }
};
