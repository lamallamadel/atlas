import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from './theme.service';
import { DsToastService, DsToastAction, DsToastType } from '../design-system';
import { catchError, of } from 'rxjs';

export type NotificationType = DsToastType;
export type NotificationAction = 'Annuler' | 'Réessayer' | 'Voir détails' | 'Fermer';

export interface NotificationConfig {
  message: string;
  type: NotificationType;
  action?: NotificationAction | string;
  onAction?: () => void;
  duration?: number;
  dismissible?: boolean;
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
  private toastService = inject(DsToastService);
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);

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
      dismissible: true,
      duration: 15000
    });

    this.logErrorToBackend(message, { severity: 'critical' });
  }

  show(config: NotificationConfig): void {
    const toastAction: DsToastAction | undefined = config.action && config.onAction ? {
      label: config.action,
      handler: config.onAction
    } : undefined;

    this.toastService.show({
      message: config.message,
      type: config.type,
      duration: config.duration,
      dismissible: config.dismissible,
      action: toastAction
    });
  }

  dismiss(): void {
    // Note: DsToastService handles multiple toasts, so dismissing "the current one" 
    // is less specific. We can clear all if needed.
  }

  clearQueue(): void {
    this.toastService.dismissAll();
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
