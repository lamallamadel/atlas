import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationService } from './notification.service';
import { ThemeService } from './theme.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let themeService: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        NotificationService,
        ThemeService
      ]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    themeService = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success notification', () => {
    const spy = spyOn(service as any, 'show');
    service.success('Test success message');
    expect(spy).toHaveBeenCalledWith({
      message: 'Test success message',
      type: 'success',
      action: undefined,
      onAction: undefined,
      priority: 'normal'
    });
  });

  it('should show error notification and log to backend', () => {
    const spy = spyOn(service as any, 'show');
    service.error('Test error message');
    
    expect(spy).toHaveBeenCalledWith({
      message: 'Test error message',
      type: 'error',
      action: 'Fermer',
      onAction: undefined,
      priority: 'high'
    });

    const req = httpMock.expectOne('/api/v1/observability/client-errors');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.level).toBe('error');
    req.flush({});
  });

  it('should not log to backend when logToBackend is false', () => {
    service.error('Test error', undefined, undefined, false);
    httpMock.expectNone('/api/v1/observability/client-errors');
  });

  it('should prioritize critical notifications', () => {
    service.info('Info 1');
    service.info('Info 2');
    service.critical('Critical message');
    
    expect(service.getQueueLength()).toBeGreaterThan(0);
  });

  it('should clear queue', () => {
    service.info('Info 1');
    service.info('Info 2');
    service.clearQueue();
    expect(service.getQueueLength()).toBe(0);
  });

  it('should provide convenience methods', () => {
    const spy = spyOn(service, 'success');
    const retryFn = jasmine.createSpy('retry');
    
    service.successWithUndo('Test', retryFn);
    
    expect(spy).toHaveBeenCalledWith('Test', 'Annuler', retryFn);
  });
});
