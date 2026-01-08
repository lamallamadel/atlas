import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';

function buildJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64url = (obj: any) => {
    const json = JSON.stringify(obj);
    // btoa() is available in the Karma browser runtime
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };
  return `${base64url(header)}.${base64url(payload)}.sig`;
}

describe('AuthService', () => {
  let service: AuthService;
  let oauthService: jasmine.SpyObj<OAuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();

    oauthService = jasmine.createSpyObj<OAuthService>('OAuthService', [
      'configure',
      'setStorage',
      'loadDiscoveryDocumentAndTryLogin',
      'hasValidAccessToken',
      'getAccessToken',
      'initCodeFlow',
      'logOut'
    ]);
    oauthService.hasValidAccessToken.and.returnValue(false);
    oauthService.getAccessToken.and.returnValue('');
    oauthService.loadDiscoveryDocumentAndTryLogin.and.resolveTo();

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: OAuthService, useValue: oauthService },
        { provide: Router, useValue: router }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should store token on manual login and return it via getToken', () => {
    const token = buildJwt({ sub: 'u1', roles: ['USER'], exp: Math.floor(Date.now() / 1000) + 3600 });
    service.login(token);

    expect(service.getToken()).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return roles from token (roles claim)', () => {
    const token = buildJwt({ sub: 'u1', roles: ['ADMIN', 'USER'], exp: Math.floor(Date.now() / 1000) + 3600 });
    service.login(token);

    expect(service.getUserRoles()).toEqual(['ADMIN', 'USER']);
    expect(service.hasRole('ADMIN')).toBe(true);
    expect(service.hasRole('MANAGER')).toBe(false);
  });

  it('should prefer oauth access token when available', () => {
    oauthService.hasValidAccessToken.and.returnValue(true);
    oauthService.getAccessToken.and.returnValue('oidc-token');

    expect(service.getToken()).toBe('oidc-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('logout should clear tokens and navigate to /login', () => {
    const token = buildJwt({ sub: 'u1', roles: ['USER'], exp: Math.floor(Date.now() / 1000) + 3600 });
    service.login(token);

    service.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    expect(oauthService.logOut).toHaveBeenCalled();
  });
});
