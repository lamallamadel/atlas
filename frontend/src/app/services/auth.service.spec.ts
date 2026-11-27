import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { demoToken } from '../pages/login/demo-token';
import { DEMO_ACCOUNTS } from '../pages/login/demo-accounts';

function buildJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64url = (obj: any) => {
    const json = JSON.stringify(obj);
    // btoa() is available in the Karma browser runtime
    return btoa(json)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  };
  return `${base64url(header)}.${base64url(payload)}.sig`;
}

describe('AuthService', () => {
  let service: AuthService;
  let oauthService: AngularVitestPartialMock<OAuthService>;
  let router: AngularVitestPartialMock<Router>;

  beforeEach(() => {
    localStorage.clear();

    oauthService = {
      configure: vi.fn().mockName('OAuthService.configure'),
      setStorage: vi.fn().mockName('OAuthService.setStorage'),
      loadDiscoveryDocumentAndTryLogin: vi
        .fn()
        .mockName('OAuthService.loadDiscoveryDocumentAndTryLogin'),
      hasValidAccessToken: vi.fn().mockName('OAuthService.hasValidAccessToken'),
      getAccessToken: vi.fn().mockName('OAuthService.getAccessToken'),
      initCodeFlow: vi.fn().mockName('OAuthService.initCodeFlow'),
      logOut: vi.fn().mockName('OAuthService.logOut')};
    oauthService.hasValidAccessToken.mockReturnValue(false);
    oauthService.getAccessToken.mockReturnValue('');
    oauthService.loadDiscoveryDocumentAndTryLogin.mockResolvedValue(undefined);

    router = {
      navigate: vi.fn().mockName('Router.navigate')};

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: OAuthService, useValue: oauthService },
        { provide: Router, useValue: router }]});

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should store token on manual login and return it via getToken', () => {
    const token = buildJwt({
      sub: 'u1',
      roles: ['USER'],
      exp: Math.floor(Date.now() / 1000) + 3600});
    service.login(token);

    expect(service.getToken()).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return roles from token (roles claim)', () => {
    const token = buildJwt({
      sub: 'u1',
      roles: ['ADMIN', 'USER'],
      exp: Math.floor(Date.now() / 1000) + 3600});
    service.login(token);

    expect(service.getUserRoles()).toEqual(['ADMIN', 'USER']);
    expect(service.hasRole('ADMIN')).toBe(true);
    expect(service.hasRole('MANAGER')).toBe(false);
  });

  it('should prefer oauth access token when available', () => {
    oauthService.hasValidAccessToken.mockReturnValue(true);
    oauthService.getAccessToken.mockReturnValue('oidc-token');

    expect(service.getToken()).toBe('oidc-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it("prend l'agence du jeton (claim org_id) pour X-Org-Id", () => {
    localStorage.setItem('org_id', 'ORG-001');
    (service as any).syncOrgIdFromToken(buildJwt({ sub: 'u1', org_id: 'ORG-042' }));
    expect(localStorage.getItem('org_id')).toBe('ORG-042');
  });

  it("garde l'agence locale si le jeton n'a pas de claim org_id", () => {
    localStorage.setItem('org_id', 'ORG-001');
    (service as any).syncOrgIdFromToken(buildJwt({ sub: 'u1' }));
    (service as any).syncOrgIdFromToken('pas-un-jwt');
    expect(localStorage.getItem('org_id')).toBe('ORG-001');
  });

  it('logout should clear tokens and navigate to /login', () => {
    const token = buildJwt({
      sub: 'u1',
      roles: ['USER'],
      exp: Math.floor(Date.now() / 1000) + 3600});
    service.login(token);

    service.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      replaceUrl: true});
    expect(oauthService.logOut).toHaveBeenCalled();
  });

  it('lit un compte démo : rôles, utilisateur et organisation du jeton mock-demo', () => {
    const owner = DEMO_ACCOUNTS.find(a => a.sub === 'demo-owner-05')!;
    service.login(demoToken(owner));
    expect(service.getUserRoles()).toEqual(['OWNER']);
    expect(service.getUserId()).toBe('demo-owner-05');
    expect(service.hasRole('OWNER')).toBe(true);
  });
});
