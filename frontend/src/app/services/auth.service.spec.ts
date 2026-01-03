import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('smoke test: token storage and retrieval', () => {
    it('should store and retrieve token correctly', () => {
      const testToken = 'test.jwt.token';
      
      expect(service.getToken()).toBeNull();
      
      service.login(testToken);
      expect(service.getToken()).toBe(testToken);
      expect(localStorage.getItem('auth_token')).toBe(testToken);
      
      service.logout();
      expect(service.getToken()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('login', () => {
    it('should store token in localStorage', () => {
      const token = 'test.token.here';
      service.login(token);
      expect(localStorage.getItem('auth_token')).toBe(token);
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('auth_token', 'test.token.here');
      service.logout();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      const token = 'test.token.here';
      localStorage.setItem('auth_token', token);
      expect(service.getToken()).toBe(token);
    });

    it('should return null if no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false if no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false if token is invalid', () => {
      localStorage.setItem('auth_token', 'invalid.token');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true for valid non-expired token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureExp, roles: ['USER'] }));
      const token = `header.${payload}.signature`;
      localStorage.setItem('auth_token', token);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const payload = btoa(JSON.stringify({ exp: pastExp, roles: ['USER'] }));
      const token = `header.${payload}.signature`;
      localStorage.setItem('auth_token', token);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getUserRoles', () => {
    it('should return empty array if no token exists', () => {
      expect(service.getUserRoles()).toEqual([]);
    });

    it('should return roles from token payload', () => {
      const roles = ['ADMIN', 'USER'];
      const payload = btoa(JSON.stringify({ roles }));
      const token = `header.${payload}.signature`;
      localStorage.setItem('auth_token', token);
      expect(service.getUserRoles()).toEqual(roles);
    });

    it('should return empty array if roles not in payload', () => {
      const payload = btoa(JSON.stringify({ sub: 'user123' }));
      const token = `header.${payload}.signature`;
      localStorage.setItem('auth_token', token);
      expect(service.getUserRoles()).toEqual([]);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the role', () => {
      const roles = ['ADMIN', 'USER'];
      const payload = btoa(JSON.stringify({ roles }));
      const token = `header.${payload}.signature`;
      localStorage.setItem('auth_token', token);
      expect(service.hasRole('ADMIN')).toBe(true);
    });

    it('should return false if user does not have the role', () => {
      const roles = ['USER'];
      const payload = btoa(JSON.stringify({ roles }));
      const token = `header.${payload}.signature`;
      localStorage.setItem('auth_token', token);
      expect(service.hasRole('ADMIN')).toBe(false);
    });

    it('should return false if no token exists', () => {
      expect(service.hasRole('ADMIN')).toBe(false);
    });
  });
});
