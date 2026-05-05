import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

function createRouteSnapshot(data: any): ActivatedRouteSnapshot {
  // ActivatedRouteSnapshot has many required fields; for unit tests we only need `data`.
  const route = new ActivatedRouteSnapshot();
  (route as any).data = data;
  return route;
}

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authService: AngularVitestPartialMock<AuthService>;
  let router: AngularVitestPartialMock<Router>;

  beforeEach(() => {
    const authServiceSpy = {
      hasRole: vi.fn().mockName('AuthService.hasRole'),
    };
    const routerSpy = {
      navigate: vi.fn().mockName('Router.navigate'),
    };

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(RoleGuard);
    authService = TestBed.inject(AuthService) as AngularVitestPartialMock<AuthService>;
    router = TestBed.inject(Router) as AngularVitestPartialMock<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if no roles are required', () => {
    const route = createRouteSnapshot({});

    const result = guard.canActivate(route);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow access if user has one of the required roles', () => {
    const route = createRouteSnapshot({ roles: ['ADMIN', 'MANAGER'] });
    authService.hasRole.mockImplementation((role: string) => role === 'ADMIN');

    const result = guard.canActivate(route);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to /access-denied if user does not have required roles', () => {
    const route = createRouteSnapshot({ roles: ['ADMIN', 'MANAGER'] });
    authService.hasRole.mockReturnValue(false);

    const result = guard.canActivate(route);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/access-denied']);
  });

  it('should check all required roles', () => {
    const route = createRouteSnapshot({ roles: ['ADMIN', 'MANAGER'] });
    authService.hasRole.mockImplementation(
      (role: string) => role === 'MANAGER'
    );

    const result = guard.canActivate(route);

    expect(result).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith('ADMIN');
    expect(authService.hasRole).toHaveBeenCalledWith('MANAGER');
  });
});
