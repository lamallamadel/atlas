import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { EnhancedSnackbarComponent } from '../components/enhanced-snackbar.component';

export interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action?: string;
  onAction?: () => void;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastNotificationService {
  private queue: ToastNotification[] = [];
  private isShowing = false;
  private currentSnackBarRef: MatSnackBarRef<EnhancedSnackbarComponent> | null = null;

  constructor(private snackBar: MatSnackBar) {}

  success(message: string, action?: string, onAction?: () => void, duration = 5000): void {
    this.show({
      message,
      type: 'success',
      action,
      onAction,
      duration,
      dismissible: true
    });
  }

  error(message: string, action?: string, onAction?: () => void, duration = 7000): void {
    this.show({
      message,
      type: 'error',
      action,
      onAction,
      duration,
      dismissible: true
    });
  }

  warning(message: string, action?: string, onAction?: () => void, duration = 6000): void {
    this.show({
      message,
      type: 'warning',
      action,
      onAction,
      duration,
      dismissible: true
    });
  }

  info(message: string, action?: string, onAction?: () => void, duration = 5000): void {
    this.show({
      message,
      type: 'info',
      action,
      onAction,
      duration,
      dismissible: true
    });
  }

  private show(notification: ToastNotification): void {
    this.queue.push(notification);
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

    this.currentSnackBarRef = this.snackBar.openFromComponent(EnhancedSnackbarComponent, {
      data: notification,
      duration: notification.duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`${notification.type}-snackbar`, 'enhanced-snackbar']
    });

    this.currentSnackBarRef.afterDismissed().subscribe(() => {
      this.currentSnackBarRef = null;
      setTimeout(() => this.showNext(), 300);
    });
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
}
