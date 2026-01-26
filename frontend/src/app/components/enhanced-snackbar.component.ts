import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationConfig } from '../services/notification.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-enhanced-snackbar',
  template: `
    <div class="enhanced-snackbar-content" [@slideIn]="animationState" [class.critical]="data.priority === 'critical'">
      <div class="snackbar-icon" [class]="'icon-' + data.type">
        <mat-icon *ngIf="data.type === 'success'">check_circle</mat-icon>
        <mat-icon *ngIf="data.type === 'error'">error</mat-icon>
        <mat-icon *ngIf="data.type === 'warning'">warning</mat-icon>
        <mat-icon *ngIf="data.type === 'info'">info</mat-icon>
      </div>
      <div class="snackbar-message">{{ data.message }}</div>
      <div class="snackbar-actions">
        <button 
          *ngIf="data.action && data.onAction" 
          mat-button 
          class="snackbar-action-btn"
          (click)="onAction()"
          [attr.aria-label]="data.action">
          {{ data.action }}
        </button>
        <button 
          *ngIf="data.dismissible"
          mat-icon-button 
          class="snackbar-close-btn"
          (click)="dismiss()"
          aria-label="Fermer">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .enhanced-snackbar-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 8px;
      min-width: 344px;
      max-width: 568px;
    }

    .enhanced-snackbar-content.critical {
      border-left: 4px solid #f44336;
      padding-left: 12px;
    }

    .snackbar-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .snackbar-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .snackbar-icon.icon-success mat-icon {
      color: #4caf50;
    }

    .snackbar-icon.icon-error mat-icon {
      color: #f44336;
    }

    .snackbar-icon.icon-warning mat-icon {
      color: #ff9800;
    }

    .snackbar-icon.icon-info mat-icon {
      color: #2196f3;
    }

    .snackbar-message {
      flex: 1;
      font-size: 14px;
      line-height: 20px;
      font-weight: 400;
    }

    .snackbar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .snackbar-action-btn {
      font-weight: 500;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .snackbar-close-btn {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .snackbar-close-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 599px) {
      .enhanced-snackbar-content {
        min-width: auto;
        max-width: 100%;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      state('void', style({ transform: 'translateY(-100%)', opacity: 0 })),
      state('*', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', animate('300ms cubic-bezier(0, 0, 0.2, 1)')),
      transition('* => void', animate('200ms cubic-bezier(0.4, 0, 1, 1)'))
    ])
  ]
})
export class EnhancedSnackbarComponent {
  animationState = 'in';

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: NotificationConfig & { dismissible: boolean },
    private snackBarRef: MatSnackBarRef<EnhancedSnackbarComponent>
  ) {}

  onAction(): void {
    if (this.data.onAction) {
      this.data.onAction();
    }
    this.dismiss();
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
