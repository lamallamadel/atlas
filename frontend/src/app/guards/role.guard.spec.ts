import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(RoleGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if no roles are required', () => {
    const route = { data: {} } as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow access if user has one of the required roles', () => {
    const route = { data: { roles: ['ADMIN', 'MANAGER'] } } as ActivatedRouteSnapshot;
    authService.hasRole.and.callFake((role: string) => role === 'ADMIN');

    const result = guard.canActivate(route);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to /access-denied if user does not have required roles', () => {
    const route = { data: { roles: ['ADMIN', 'MANAGER'] } } as ActivatedRouteSnapshot;
    authService.hasRole.and.returnValue(false);

    const result = guard.canActivate(route);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/access-denied']);
  });

  it('should check all required roles', () => {
    const route = { data: { roles: ['ADMIN', 'MANAGER'] } } as ActivatedRouteSnapshot;
    authService.hasRole.and.callFake((role: string) => role === 'MANAGER');

    const result = guard.canActivate(route);

    expect(result).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith('ADMIN');
    expect(authService.hasRole).toHaveBeenCalledWith('MANAGER');
  });
});
