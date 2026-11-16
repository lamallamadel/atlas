import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting} from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { ThemeService } from './theme.service';
import { DsToastService } from '../design-system';
import {
  provideHttpClient,
  withInterceptorsFromDi} from '@angular/common/http';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let mockToastService: Pick<DsToastService, 'show' | 'dismissAll'>;

  beforeEach(() => {
    mockToastService = {
      show: vi.fn().mockReturnValue('mock-toast-id'),
      dismissAll: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DsToastService, useValue: mockToastService },
        NotificationService,
        ThemeService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()]});
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success notification', () => {
    const spy = vi.spyOn(service as any, 'show');
    service.success('Test success message');
    expect(spy).toHaveBeenCalledWith({
      message: 'Test success message',
      type: 'success',
      action: undefined,
      onAction: undefined,
      priority: 'normal'});
  });

  it('should show error notification and log to backend', () => {
    const spy = vi.spyOn(service as any, 'show');
    service.error('Test error message');

    expect(spy).toHaveBeenCalledWith({
      message: 'Test error message',
      type: 'error',
      action: 'Fermer',
      onAction: undefined,
      priority: 'high'});

    const req = httpMock.expectOne('/api/v1/observability/client-errors');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.level).toBe('error');
    req.flush({});
  });

  it('should not log to backend when logToBackend is false', () => {
    service.error('Test error', undefined, undefined, false);
    httpMock.expectNone('/api/v1/observability/client-errors');
  });

  it('should show critical notification with high duration', () => {
    const spy = vi.spyOn(service as any, 'show');
    service.critical('Critical message');

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Critical message',
      type: 'error',
      priority: 'critical'
    }));

    httpMock.expectOne('/api/v1/observability/client-errors').flush({});
  });

  it('should clear queue via dismissAll', () => {
    service.info('Info 1');
    service.clearQueue();
    expect(mockToastService.dismissAll).toHaveBeenCalled();
  });

  it('should provide convenience methods', () => {
    const spy = vi.spyOn(service, 'success');
    const retryFn = vi.fn();

    service.successWithUndo('Test', retryFn);

    expect(spy).toHaveBeenCalledWith('Test', 'Annuler', retryFn);
  });
});
