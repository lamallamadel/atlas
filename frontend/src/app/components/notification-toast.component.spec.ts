import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { NotificationToastComponent } from './notification-toast.component';
import { ToastNotificationService } from '../services/toast-notification.service';
import { AriaLiveAnnouncerService } from '../services/aria-live-announcer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

describe('NotificationToastComponent', () => {
  let component: NotificationToastComponent;
  let fixture: ComponentFixture<NotificationToastComponent>;
  let toastService: jasmine.SpyObj<ToastNotificationService>;

  beforeEach(async () => {
    const toastServiceSpy = jasmine.createSpyObj('ToastNotificationService', [
      'dismiss',
      'activeToasts'
    ]);
    toastServiceSpy.activeToasts = of([]);

    await TestBed.configureTestingModule({
      declarations: [NotificationToastComponent],
      imports: [BrowserAnimationsModule, MatIconModule],
      providers: [
        { provide: ToastNotificationService, useValue: toastServiceSpy },
        AriaLiveAnnouncerService,
        MatSnackBar
      ]
    }).compileComponents();

    toastService = TestBed.inject(ToastNotificationService) as jasmine.SpyObj<ToastNotificationService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get correct icon for toast type', () => {
    expect(component.getIcon('success')).toBe('check_circle');
    expect(component.getIcon('error')).toBe('cancel');
    expect(component.getIcon('warning')).toBe('warning');
    expect(component.getIcon('info')).toBe('info');
  });

  it('should calculate progress correctly', () => {
    const toast = {
      id: 'test-1',
      message: 'Test',
      type: 'info' as const,
      duration: 5000,
      startTime: Date.now() - 2500,
      dismissible: true,
      position: 'top-right' as const,
      showProgress: true
    };

    const progress = component.getProgress(toast);
    expect(progress).toBeGreaterThanOrEqual(45);
    expect(progress).toBeLessThanOrEqual(55);
  });

  it('should call dismiss on toast service when onDismiss is called', () => {
    const toast = {
      id: 'test-1',
      message: 'Test',
      type: 'info' as const,
      duration: 5000,
      startTime: Date.now(),
      dismissible: true,
      position: 'top-right' as const,
      showProgress: true
    };

    component.onDismiss(toast);
    expect(toastService.dismiss).toHaveBeenCalledWith('test-1');
  });

  it('should get correct position class', () => {
    expect(component.getPositionClass('top-right')).toBe('toast-container-top-right');
    expect(component.getPositionClass('bottom-left')).toBe('toast-container-bottom-left');
  });
});
