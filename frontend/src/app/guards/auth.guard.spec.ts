import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;
  let mockUrlTree: UrlTree;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;
    mockUrlTree = {} as UrlTree;

    router.createUrlTree.and.returnValue(mockUrlTree);

    spyOn(sessionStorage, 'setItem');
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if user is authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = guard.canActivate(mockRoute, mockState);

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to /login if user is not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = guard.canActivate(mockRoute, mockState);

    expect(result).toBe(mockUrlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(sessionStorage.setItem).toHaveBeenCalledWith('returnUrl', '/dashboard');
  });

  describe('route protection', () => {
    it('should block route without token', () => {
      authService.isAuthenticated.and.returnValue(false);
      mockState.url = '/protected-route';

      const canActivate = guard.canActivate(mockRoute, mockState);

      expect(canActivate).toBe(mockUrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(sessionStorage.setItem).toHaveBeenCalledWith('returnUrl', '/protected-route');
    });

    it('should allow route with valid token', () => {
      authService.isAuthenticated.and.returnValue(true);

      const canActivate = guard.canActivate(mockRoute, mockState);

      expect(canActivate).toBe(true);
      expect(router.createUrlTree).not.toHaveBeenCalled();
      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
