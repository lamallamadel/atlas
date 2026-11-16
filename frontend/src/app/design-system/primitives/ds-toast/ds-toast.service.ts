import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AriaLiveAnnouncerService } from '../../../services/aria-live-announcer.service';

export type DsToastType = 'success' | 'error' | 'warning' | 'info';

export interface DsToastAction {
  label: string;
  handler: () => void;
}

export interface DsToast {
  id: string;
  message: string;
  type: DsToastType;
  duration?: number;
  dismissible?: boolean;
  action?: DsToastAction;
  startTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class DsToastService {
  private ariaLiveAnnouncer = inject(AriaLiveAnnouncerService);
  
  private activeToasts$ = new BehaviorSubject<DsToast[]>([]);
  private queue: Omit<DsToast, 'startTime'>[] = [];
  private readonly maxSimultaneous = 3;
  
  get activeToasts(): Observable<DsToast[]> {
    return this.activeToasts$.asObservable();
  }

  success(message: string, action?: DsToastAction, duration = 5000): string {
    return this.show({ message, type: 'success', action, duration });
  }

  error(message: string, action?: DsToastAction, duration = 8000): string {
    return this.show({ message, type: 'error', action, duration });
  }

  warning(message: string, action?: DsToastAction, duration = 6000): string {
    return this.show({ message, type: 'warning', action, duration });
  }

  info(message: string, action?: DsToastAction, duration = 5000): string {
    return this.show({ message, type: 'info', action, duration });
  }

  show(toast: Omit<DsToast, 'id' | 'startTime'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: DsToast = {
      ...toast,
      id,
      startTime: Date.now(),
      duration: toast.duration ?? 5000,
      dismissible: toast.dismissible ?? true
    };

    // Announce to screen readers
    const typeLabel = this.getTypeLabel(newToast.type);
    this.ariaLiveAnnouncer.announce(
      `${typeLabel}: ${newToast.message}`, 
      newToast.type === 'error' ? 'assertive' : 'polite'
    );

    const active = this.activeToasts$.value;
    if (active.length >= this.maxSimultaneous) {
      this.queue.push(newToast);
    } else {
      this.activeToasts$.next([...active, newToast]);
    }

    return id;
  }

  dismiss(id: string): void {
    const currentToasts = this.activeToasts$.value;
    this.activeToasts$.next(currentToasts.filter(t => t.id !== id));
    this.processQueue();
  }

  private processQueue(): void {
    const active = this.activeToasts$.value;
    while (this.queue.length > 0 && active.length < this.maxSimultaneous) {
      const next = this.queue.shift();
      if (next) {
        this.activeToasts$.next([...this.activeToasts$.value, { ...next, startTime: Date.now() }]);
      }
    }
  }

  dismissAll(): void {
    this.activeToasts$.next([]);
    this.queue = [];
  }

  private getTypeLabel(type: DsToastType): string {
    const labels: Record<DsToastType, string> = {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Avertissement',
      info: 'Information'
    };
    return labels[type];
  }
}
