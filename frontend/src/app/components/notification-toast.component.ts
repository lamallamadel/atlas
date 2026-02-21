import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { 
  trigger, 
  state, 
  style, 
  transition, 
  animate 
} from '@angular/animations';
import { Subscription } from 'rxjs';
import { 
  ToastNotificationService, 
  ActiveToast,
  ToastPosition,
  ToastType
} from '../services/toast-notification.service';

interface ToastGroup {
  position: ToastPosition;
  toasts: ActiveToast[];
}

@Component({
  selector: 'app-notification-toast',
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ 
          opacity: 0, 
          transform: 'translateX(100%)' 
        }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ 
          opacity: 1, 
          transform: 'translateX(0)' 
        }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 1, 1)', style({ 
          opacity: 0, 
          transform: 'translateX(100%)' 
        }))
      ])
    ]),
    trigger('fadeOut', [
      transition(':leave', [
        animate('200ms ease-out', style({ 
          opacity: 0 
        }))
      ])
    ])
  ]
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  toastGroups: Map<ToastPosition, ActiveToast[]> = new Map();
  positions: ToastPosition[] = [
    'top-right',
    'top-left', 
    'top-center',
    'bottom-right',
    'bottom-left',
    'bottom-center'
  ];

  private subscription?: Subscription;

  constructor(
    private toastService: ToastNotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.toastService.activeToasts.subscribe(toasts => {
      this.groupToastsByPosition(toasts);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private groupToastsByPosition(toasts: ActiveToast[]): void {
    this.toastGroups.clear();
    
    toasts.forEach(toast => {
      const position = toast.position || 'top-right';
      const group = this.toastGroups.get(position) || [];
      group.push(toast);
      this.toastGroups.set(position, group);
    });
  }

  getToastsForPosition(position: ToastPosition): ActiveToast[] {
    return this.toastGroups.get(position) || [];
  }

  onDismiss(toast: ActiveToast): void {
    this.toastService.dismiss(toast.id);
  }

  onAction(toast: ActiveToast): void {
    if (toast.action?.handler) {
      toast.action.handler();
    }
    this.toastService.dismiss(toast.id);
  }

  onSwipeLeft(toast: ActiveToast): void {
    this.toastService.dismiss(toast.id);
  }

  onSwipeRight(toast: ActiveToast): void {
    this.toastService.dismiss(toast.id);
  }

  getIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      success: 'check_circle',
      error: 'cancel',
      warning: 'warning',
      info: 'info'
    };
    return icons[type];
  }

  getProgress(toast: ActiveToast): number {
    if (!toast.duration || toast.duration <= 0) {
      return 0;
    }

    const elapsed = Date.now() - toast.startTime;
    const progress = Math.max(0, Math.min(100, (elapsed / toast.duration) * 100));
    return progress;
  }

  trackByToastId(index: number, toast: ActiveToast): string {
    return toast.id;
  }

  getPositionClass(position: ToastPosition): string {
    const classes: Record<ToastPosition, string> = {
      'top-right': 'toast-container-top-right',
      'top-left': 'toast-container-top-left',
      'top-center': 'toast-container-top-center',
      'bottom-right': 'toast-container-bottom-right',
      'bottom-left': 'toast-container-bottom-left',
      'bottom-center': 'toast-container-bottom-center'
    };
    return classes[position];
  }
}
