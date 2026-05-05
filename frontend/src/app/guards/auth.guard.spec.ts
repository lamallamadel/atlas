import { TestBed } from '@angular/core/testing';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: AngularVitestPartialMock<AuthService>;
  let router: AngularVitestPartialMock<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;
  let mockUrlTree: UrlTree;
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const authServiceSpy = {
      isAuthenticated: vi.fn().mockName('AuthService.isAuthenticated'),
    };
    const routerSpy = {
      navigate: vi.fn().mockName('Router.navigate'),
      createUrlTree: vi.fn().mockName('Router.createUrlTree'),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as AngularVitestPartialMock<AuthService>;
    router = TestBed.inject(Router) as AngularVitestPartialMock<Router>;

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;
    mockUrlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(mockUrlTree);

    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  });

  afterEach(() => {
    setItemSpy.mockRestore();
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if user is authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = guard.canActivate(mockRoute, mockState);

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to /login if user is not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = guard.canActivate(mockRoute, mockState);

    expect(result).toBe(mockUrlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'returnUrl',
      '/dashboard'
    );
  });

  describe('route protection', () => {
    it('should block route without token', () => {
      authService.isAuthenticated.mockReturnValue(false);
      mockState.url = '/protected-route';

      const canActivate = guard.canActivate(mockRoute, mockState);

      expect(canActivate).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(setItemSpy).toHaveBeenCalledWith(
        'returnUrl',
        '/protected-route'
      );
    });

    it('should allow route with valid token', () => {
      authService.isAuthenticated.mockReturnValue(true);

      const canActivate = guard.canActivate(mockRoute, mockState);

      expect(canActivate).toBe(true);
      expect(router.createUrlTree).not.toHaveBeenCalled();
      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });
});
