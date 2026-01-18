import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastNotificationService } from './toast-notification.service';

describe('ToastNotificationService', () => {
  let service: ToastNotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        ToastNotificationService,
        { provide: MatSnackBar, useValue: spy }
      ]
    });

    service = TestBed.inject(ToastNotificationService);
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success notification', () => {
    const mockSnackBarRef = {
      onAction: () => ({ subscribe: () => ({}) }),
      afterDismissed: () => ({
        subscribe: (callback: () => void) => {
          setTimeout(callback, 100);
        }
      })
    };
    snackBarSpy.open.and.returnValue(mockSnackBarRef as any);

    service.success('Test success message');

    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('should show error notification', () => {
    const mockSnackBarRef = {
      onAction: () => ({ subscribe: () => ({}) }),
      afterDismissed: () => ({
        subscribe: (callback: () => void) => {
          setTimeout(callback, 100);
        }
      })
    };
    snackBarSpy.open.and.returnValue(mockSnackBarRef as any);

    service.error('Test error message');

    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('should queue notifications', () => {
    const mockSnackBarRef = {
      onAction: () => ({ subscribe: () => ({}) }),
      afterDismissed: () => ({
        subscribe: (callback: () => void) => {
          setTimeout(callback, 100);
        }
      })
    };
    snackBarSpy.open.and.returnValue(mockSnackBarRef as any);

    service.success('Message 1');
    service.success('Message 2');

    expect(snackBarSpy.open).toHaveBeenCalledTimes(1);
  });
});
