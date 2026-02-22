import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Router } from '@angular/router';
import { CorrelationIdInterceptor } from './correlation-id.interceptor';
import { AuthService } from '../services/auth.service';
import { ToastNotificationService } from '../services/toast-notification.service';

describe('CorrelationIdInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let router: jasmine.SpyObj<Router>;
  let toastService: jasmine.SpyObj<ToastNotificationService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const toastServiceSpy = jasmine.createSpyObj('ToastNotificationService', [
      'success', 'error', 'warning', 'info'
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', ['handleSessionExpired']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ToastNotificationService, useValue: toastServiceSpy },
        { provide: AuthService, useValue: authSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: CorrelationIdInterceptor,
          multi: true
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    toastService = TestBed.inject(ToastNotificationService) as jasmine.SpyObj<ToastNotificationService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add X-Correlation-Id header to requests', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('X-Correlation-Id')).toBe(true);
    expect(req.request.headers.get('X-Correlation-Id')).toMatch(/^\d+-[a-z0-9]+$/);
    req.flush({});
  });

  it('should not add X-Correlation-Id to non-API requests', () => {
    httpClient.get('/assets/config.json').subscribe();

    const req = httpMock.expectOne('/assets/config.json');
    expect(req.request.headers.has('X-Correlation-Id')).toBe(false);
    req.flush({});
  });

  describe('error handling', () => {
    it('should show error toast and trigger session expired on 401 error', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed with 401 error'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      httpMock.verify();

      expect(toastService.error).toHaveBeenCalledWith(
        'Session expirée. Veuillez vous reconnecter.',
        jasmine.objectContaining({ label: 'Reconnecter', handler: jasmine.any(Function) })
      );
    });

    it('should handle 403 Forbidden error with toast', () => {
      httpClient.get('/api/admin').subscribe({
        next: () => fail('should have failed with 403 error'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne('/api/admin');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
      httpMock.verify();

      expect(toastService.error).toHaveBeenCalledWith(
        "Accès refusé. Vous n'avez pas les droits nécessaires.",
        'Fermer'
      );
    });

    it('should handle 400 Bad Request error', () => {
      httpClient.post('/api/data', {}).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne('/api/data');
      req.flush({ detail: 'Invalid data' }, { status: 400, statusText: 'Bad Request' });
      httpMock.verify();

      expect(toastService.error).toHaveBeenCalledWith('Invalid data', 'Fermer');
    });

    it('should handle 404 Not Found error', () => {
      httpClient.get('/api/item/999').subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne('/api/item/999');
      req.flush({ detail: 'Resource not found' }, { status: 404, statusText: 'Not Found' });
      httpMock.verify();

      expect(toastService.error).toHaveBeenCalledWith('Resource not found', 'Fermer');
    });

    it('should handle 409 Conflict error with retry action', () => {
      httpClient.post('/api/resource', {}).subscribe({
        next: () => fail('should have failed with 409 error'),
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne('/api/resource');
      req.flush({ detail: 'Resource already exists' }, { status: 409, statusText: 'Conflict' });
      httpMock.verify();

      expect(toastService.warning).toHaveBeenCalledWith(
        'Resource already exists',
        jasmine.objectContaining({ label: 'Réessayer', handler: jasmine.any(Function) })
      );
    });

    it('should handle 500 Internal Server Error with retry action', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ detail: 'Internal error occurred' }, { status: 500, statusText: 'Internal Server Error' });
      httpMock.verify();

      expect(toastService.error).toHaveBeenCalledWith(
        'Internal error occurred',
        jasmine.objectContaining({ label: 'Réessayer', handler: jasmine.any(Function) })
      );
    });

    it('should handle network errors (status 0)', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ErrorEvent('Network error'), { status: 0 });
      httpMock.verify();

      expect(toastService.error).toHaveBeenCalledWith(
        'Impossible de contacter le serveur. Vérifiez votre connexion.',
        jasmine.objectContaining({ label: 'Réessayer', handler: jasmine.any(Function) })
      );
    });
  });

  describe('correlation ID', () => {
    it('should generate unique correlation IDs for different requests', () => {
      httpClient.get('/api/test1').subscribe();
      httpClient.get('/api/test2').subscribe();

      const req1 = httpMock.expectOne('/api/test1');
      const req2 = httpMock.expectOne('/api/test2');

      const correlationId1 = req1.request.headers.get('X-Correlation-Id');
      const correlationId2 = req2.request.headers.get('X-Correlation-Id');

      expect(correlationId1).toBeTruthy();
      expect(correlationId2).toBeTruthy();
      expect(correlationId1).not.toBe(correlationId2);

      req1.flush({});
      req2.flush({});
    });
  });
});
