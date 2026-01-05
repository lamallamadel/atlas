import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { HttpAuthInterceptor } from './http-auth.interceptor';
import { AuthService } from '../services/auth.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

describe('HttpAuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpAuthInterceptor,
          multi: true
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should attach Authorization header when token exists', () => {
    const testToken = 'test-jwt-token';
    authService.getToken.and.returnValue(testToken);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    req.flush({});
  });

  it('should attach X-Org-Id header when org_id exists in localStorage', () => {
    const testOrgId = 'org-123';
    const testToken = 'test-jwt-token';
    authService.getToken.and.returnValue(testToken);
    localStorage.setItem('org_id', testOrgId);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('X-Org-Id')).toBe(testOrgId);
    req.flush({});
  });

  it('should attach both Authorization and X-Org-Id headers when both exist', () => {
    const testToken = 'test-jwt-token';
    const testOrgId = 'org-123';
    authService.getToken.and.returnValue(testToken);
    localStorage.setItem('org_id', testOrgId);

    httpClient.get('/api/users').subscribe();

    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    expect(req.request.headers.get('X-Org-Id')).toBe(testOrgId);
    req.flush({});
  });

  it('should not attach Authorization header when token does not exist', () => {
    authService.getToken.and.returnValue(null);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should attach default X-Org-Id header when token exists but org_id is missing', () => {
    const testToken = 'test-jwt-token';
    authService.getToken.and.returnValue(testToken);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('X-Org-Id')).toBe('ORG-001');
    req.flush({});
  });

  it('should not modify requests to non-API URLs', () => {
    const testToken = 'test-jwt-token';
    authService.getToken.and.returnValue(testToken);
    localStorage.setItem('org_id', 'org-123');

    httpClient.get('/assets/config.json').subscribe();

    const req = httpMock.expectOne('/assets/config.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.headers.has('X-Org-Id')).toBe(false);
    req.flush({});
  });

  it('should only intercept requests with /api/ in URL', () => {
    const testToken = 'test-jwt-token';
    authService.getToken.and.returnValue(testToken);

    httpClient.get('https://external-service.com/data').subscribe();

    const req = httpMock.expectOne('https://external-service.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
