import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from './theme.service';
import { EnhancedSnackbarComponent } from '../components/enhanced-snackbar.component';
import { catchError, of } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type NotificationAction = 'Annuler' | 'Réessayer' | 'Voir détails' | 'Fermer';

export interface NotificationConfig {
  message: string;
  type: NotificationType;
  action?: NotificationAction | string;
  onAction?: () => void;
  duration?: number;
  dismissible?: boolean;
  position?: {
    horizontal?: MatSnackBarHorizontalPosition;
    vertical?: MatSnackBarVerticalPosition;
  };
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface ErrorLogPayload {
  message: string;
  level: 'error' | 'warning';
  timestamp: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private queue: NotificationConfig[] = [];
  private isShowing = false;
  private currentSnackBarRef: any = null;

  private readonly DEFAULT_DURATIONS: Record<NotificationType | 'critical', number> = {
    success: 4000,
    info: 5000,
    warning: 6000,
    error: 8000,
    critical: 10000
  };

  private readonly DEFAULT_POSITIONS = {
    horizontal: 'center' as MatSnackBarHorizontalPosition,
    vertical: 'top' as MatSnackBarVerticalPosition
  };

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private themeService: ThemeService
  ) {}

  success(message: string, action?: string, onAction?: () => void): void {
    this.show({
      message,
      type: 'success',
      action,
      onAction,
      priority: 'normal'
    });
  }

  error(message: string, action?: string, onAction?: () => void, logToBackend = true): void {
    this.show({
      message,
      type: 'error',
      action: action || 'Fermer',
      onAction,
      priority: 'high'
    });

    if (logToBackend) {
      this.logErrorToBackend(message);
    }
  }

  warning(message: string, action?: string, onAction?: () => void, logToBackend = false): void {
    this.show({
      message,
      type: 'warning',
      action,
      onAction,
      priority: 'normal'
    });

    if (logToBackend) {
      this.logWarningToBackend(message);
    }
  }

  info(message: string, action?: string, onAction?: () => void): void {
    this.show({
      message,
      type: 'info',
      action,
      onAction,
      priority: 'low'
    });
  }

  critical(message: string, action?: string, onAction?: () => void): void {
    this.show({
      message,
      type: 'error',
      action: action || 'Fermer',
      onAction,
      priority: 'critical',
      dismissible: true
    });

    this.logErrorToBackend(message, { severity: 'critical' });
  }

  show(config: NotificationConfig): void {
    const priority = config.priority || 'normal';
    
    if (priority === 'critical') {
      this.queue.unshift(config);
      if (this.isShowing && this.currentSnackBarRef) {
        this.currentSnackBarRef.dismiss();
      }
    } else if (priority === 'high') {
      const criticalIndex = this.queue.findIndex(n => n.priority === 'critical');
      if (criticalIndex >= 0) {
        this.queue.splice(criticalIndex + 1, 0, config);
      } else {
        this.queue.unshift(config);
      }
    } else {
      this.queue.push(config);
    }

    if (!this.isShowing) {
      this.showNext();
    }
  }

  private showNext(): void {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const notification = this.queue.shift();
    if (!notification) {
      return;
    }

    const duration = notification.duration !== undefined 
      ? notification.duration 
      : this.getDuration(notification.type, notification.priority);

    const position = notification.position || this.DEFAULT_POSITIONS;

    const snackBarConfig: MatSnackBarConfig = {
      duration,
      horizontalPosition: position.horizontal,
      verticalPosition: position.vertical,
      panelClass: this.getPanelClasses(notification.type),
      data: {
        ...notification,
        dismissible: notification.dismissible !== false
      }
    };

    this.currentSnackBarRef = this.snackBar.openFromComponent(
      EnhancedSnackbarComponent,
      snackBarConfig
    );

    this.currentSnackBarRef.afterDismissed().subscribe(() => {
      this.currentSnackBarRef = null;
      setTimeout(() => this.showNext(), 300);
    });
  }

  private getDuration(type: NotificationType, priority?: string): number {
    if (priority === 'critical') {
      return this.DEFAULT_DURATIONS.critical;
    }
    return this.DEFAULT_DURATIONS[type];
  }

  private getPanelClasses(type: NotificationType): string[] {
    const classes = [`notification-${type}`];
    
    if (this.themeService.isDarkTheme()) {
      classes.push('dark-theme-snackbar');
    }

    return classes;
  }

  dismiss(): void {
    if (this.currentSnackBarRef) {
      this.currentSnackBarRef.dismiss();
    }
  }

  clearQueue(): void {
    this.queue = [];
    this.dismiss();
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  private logErrorToBackend(message: string, context?: Record<string, any>): void {
    const payload: ErrorLogPayload = {
      message,
      level: 'error',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };

    this.http.post('/api/v1/observability/client-errors', payload)
      .pipe(
        catchError(err => {
          console.error('Failed to log error to backend:', err);
          return of(null);
        })
      )
      .subscribe();
  }

  private logWarningToBackend(message: string, context?: Record<string, any>): void {
    const payload: ErrorLogPayload = {
      message,
      level: 'warning',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };

    this.http.post('/api/v1/observability/client-errors', payload)
      .pipe(
        catchError(err => {
          console.error('Failed to log warning to backend:', err);
          return of(null);
        })
      )
      .subscribe();
  }

  successWithRetry(message: string, retryAction: () => void): void {
    this.success(message, 'Réessayer', retryAction);
  }

  errorWithRetry(message: string, retryAction: () => void): void {
    this.error(message, 'Réessayer', retryAction);
  }

  errorWithDetails(message: string, detailsAction: () => void): void {
    this.error(message, 'Voir détails', detailsAction);
  }

  successWithUndo(message: string, undoAction: () => void): void {
    this.success(message, 'Annuler', undoAction);
  }
}
