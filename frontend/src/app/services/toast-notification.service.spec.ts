import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastNotificationService } from './toast-notification.service';
import { AriaLiveAnnouncerService } from './aria-live-announcer.service';

describe('ToastNotificationService', () => {
  let service: ToastNotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const ariaLiveSpy = jasmine.createSpyObj('AriaLiveAnnouncerService', ['announce']);

    TestBed.configureTestingModule({
      providers: [
        ToastNotificationService,
        { provide: MatSnackBar, useValue: spy },
        { provide: AriaLiveAnnouncerService, useValue: ariaLiveSpy }
      ]
    });

    service = TestBed.inject(ToastNotificationService);
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success notification', () => {
    const id = service.success('Test success message');
    expect(id).toBeTruthy();
    const active = (service as any).activeToasts$.value;
    expect(active.some((t: any) => t.message === 'Test success message' && t.type === 'success')).toBe(true);
  });

  it('should show error notification', () => {
    const id = service.error('Test error message');
    expect(id).toBeTruthy();
    const active = (service as any).activeToasts$.value;
    expect(active.some((t: any) => t.message === 'Test error message' && t.type === 'error')).toBe(true);
  });

  it('should queue notifications', () => {
    service.success('Message 1');
    service.success('Message 2');
    service.success('Message 3');
    service.success('Message 4');
    const active = (service as any).activeToasts$.value;
    const queue = (service as any).queue;
    expect(active.length).toBeLessThanOrEqual(3);
    expect(active.length + queue.length).toBe(4);
  });
});
