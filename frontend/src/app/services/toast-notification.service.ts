import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
import { AriaLiveAnnouncerService } from './aria-live-announcer.service';

export type ToastPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'top-center' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'bottom-center';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  handler: () => void;
}

export interface ToastNotification {
  id?: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number;
  dismissible?: boolean;
  position?: ToastPosition;
  showProgress?: boolean;
}

export interface ActiveToast extends ToastNotification {
  id: string;
  startTime: number;
  timeoutId?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ToastNotificationService {
  private readonly maxSimultaneous = 3;
  private activeToasts$ = new BehaviorSubject<ActiveToast[]>([]);
  private queue: ToastNotification[] = [];
  
  // Legacy support
  private currentSnackBarRef: MatSnackBarRef<any> | null = null;
  private legacyMode = false;

  constructor(
    private snackBar: MatSnackBar,
    private ariaLiveAnnouncer: AriaLiveAnnouncerService
  ) {}

  get activeToasts(): Observable<ActiveToast[]> {
    return this.activeToasts$.asObservable();
  }

  success(
    message: string, 
    action?: string | ToastAction, 
    duration = 5000,
    position: ToastPosition = 'top-right'
  ): string {
    return this.show({
      message,
      type: 'success',
      action: this.normalizeAction(action),
      duration,
      dismissible: true,
      position,
      showProgress: true
    });
  }

  error(
    message: string, 
    action?: string | ToastAction, 
    duration = 7000,
    position: ToastPosition = 'top-right'
  ): string {
    return this.show({
      message,
      type: 'error',
      action: this.normalizeAction(action),
      duration,
      dismissible: true,
      position,
      showProgress: true
    });
  }

  warning(
    message: string, 
    action?: string | ToastAction, 
    duration = 6000,
    position: ToastPosition = 'top-right'
  ): string {
    return this.show({
      message,
      type: 'warning',
      action: this.normalizeAction(action),
      duration,
      dismissible: true,
      position,
      showProgress: true
    });
  }

  info(
    message: string, 
    action?: string | ToastAction, 
    duration = 5000,
    position: ToastPosition = 'top-right'
  ): string {
    return this.show({
      message,
      type: 'info',
      action: this.normalizeAction(action),
      duration,
      dismissible: true,
      position,
      showProgress: true
    });
  }

  show(notification: ToastNotification): string {
    const id = notification.id || this.generateId();
    const toast: ActiveToast = {
      ...notification,
      id,
      startTime: Date.now(),
      position: notification.position || 'top-right',
      showProgress: notification.showProgress !== false,
      dismissible: notification.dismissible !== false
    };

    // Announce to screen readers
    const announcement = `${this.getTypeLabel(toast.type)}: ${toast.message}`;
    this.ariaLiveAnnouncer.announce(
      announcement, 
      toast.type === 'error' ? 'assertive' : 'polite'
    );

    const active = this.activeToasts$.value;
    
    if (active.length >= this.maxSimultaneous) {
      this.queue.push(toast);
    } else {
      this.addToActive(toast);
    }

    return id;
  }

  dismiss(id: string): void {
    const active = this.activeToasts$.value;
    const toast = active.find(t => t.id === id);
    
    if (toast?.timeoutId) {
      clearTimeout(toast.timeoutId);
    }

    const updated = active.filter(t => t.id !== id);
    this.activeToasts$.next(updated);

    // Process queue
    this.processQueue();
  }

  dismissAll(): void {
    const active = this.activeToasts$.value;
    active.forEach(toast => {
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
    });
    this.activeToasts$.next([]);
    this.queue = [];
  }

  clearQueue(): void {
    this.queue = [];
  }

  private addToActive(toast: ActiveToast): void {
    const active = this.activeToasts$.value;
    this.activeToasts$.next([...active, toast]);

    if (toast.duration && toast.duration > 0) {
      toast.timeoutId = setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
    }
  }

  private processQueue(): void {
    const active = this.activeToasts$.value;
    
    while (this.queue.length > 0 && active.length < this.maxSimultaneous) {
      const next = this.queue.shift();
      if (next) {
        this.addToActive({
          ...next,
          startTime: Date.now()
        } as ActiveToast);
      }
    }
  }

  private normalizeAction(action?: string | ToastAction): ToastAction | undefined {
    if (!action) return undefined;
    
    if (typeof action === 'string') {
      return {
        label: action,
        handler: () => { return; }
      };
    }
    
    return action;
  }

  private getTypeLabel(type: ToastType): string {
    const labels: Record<ToastType, string> = {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Avertissement',
      info: 'Information'
    };
    return labels[type];
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Legacy support methods
  private showLegacy(notification: ToastNotification): void {
    this.legacyMode = true;
    const actionLabel = notification.action?.label ?? 'Fermer';
    this.currentSnackBarRef = this.snackBar.open(notification.message, actionLabel, {
      duration: notification.duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`${notification.type}-snackbar`]
    });

    this.currentSnackBarRef.onAction().subscribe(() => {
      try {
        notification.action?.handler();
      } catch {
        // no-op
      }
    });

    this.currentSnackBarRef.afterDismissed().subscribe(() => {
      this.currentSnackBarRef = null;
    });
  }

  dismissLegacy(): void {
    if (this.currentSnackBarRef) {
      this.currentSnackBarRef.dismiss();
    }
  }
}
