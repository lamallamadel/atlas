import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

export interface MobileAction {
  icon: string;
  label: string;
  action: string;
  color?: 'primary' | 'accent' | 'warn' | 'success' | 'default';
  disabled?: boolean;
  divider?: boolean;
}

export interface MobileActionSheetData {
  title?: string;
  subtitle?: string;
  actions: MobileAction[];
  cancelLabel?: string;
}

@Component({
  selector: 'app-mobile-action-sheet',
  template: `
    <div class="mobile-action-sheet">
      <div class="action-sheet-header" *ngIf="data.title || data.subtitle">
        <div class="action-sheet-drag-handle"></div>
        <h2 class="action-sheet-title" *ngIf="data.title">{{ data.title }}</h2>
        <p class="action-sheet-subtitle" *ngIf="data.subtitle">{{ data.subtitle }}</p>
      </div>
      
      <div class="action-sheet-content">
        <ng-container *ngFor="let action of data.actions; let last = last">
          <button
            class="action-sheet-item"
            [class.action-primary]="action.color === 'primary'"
            [class.action-accent]="action.color === 'accent'"
            [class.action-warn]="action.color === 'warn'"
            [class.action-success]="action.color === 'success'"
            [disabled]="action.disabled"
            (click)="onActionClick(action)"
            [attr.aria-label]="action.label">
            <mat-icon class="action-icon" aria-hidden="true">{{ action.icon }}</mat-icon>
            <span class="action-label">{{ action.label }}</span>
          </button>
          <mat-divider *ngIf="action.divider && !last"></mat-divider>
        </ng-container>
      </div>
      
      <div class="action-sheet-footer">
        <button
          class="action-sheet-cancel"
          (click)="onCancel()"
          [attr.aria-label]="data.cancelLabel || 'Annuler'">
          {{ data.cancelLabel || 'Annuler' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .mobile-action-sheet {
      display: flex;
      flex-direction: column;
      background: var(--color-neutral-0);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      max-height: 80vh;
      overflow: hidden;
    }

    .action-sheet-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-4) var(--spacing-6) var(--spacing-2);
      border-bottom: var(--border-width-1) solid var(--color-neutral-200);
      position: relative;
    }

    .action-sheet-drag-handle {
      width: 40px;
      height: 4px;
      background: var(--color-neutral-300);
      border-radius: var(--radius-full);
      margin-bottom: var(--spacing-3);
    }

    .action-sheet-title {
      margin: 0 0 var(--spacing-1) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
      text-align: center;
    }

    .action-sheet-subtitle {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-neutral-600);
      text-align: center;
    }

    .action-sheet-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-2) 0;
      -webkit-overflow-scrolling: touch;
    }

    .action-sheet-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
      width: 100%;
      padding: var(--spacing-4) var(--spacing-6);
      border: none;
      background: var(--color-neutral-0);
      color: var(--color-neutral-900);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      text-align: left;
      cursor: pointer;
      transition: background-color var(--duration-fast) var(--ease-out);
      min-height: 56px;
    }

    .action-sheet-item:hover:not(:disabled) {
      background: var(--color-neutral-50);
    }

    .action-sheet-item:active:not(:disabled) {
      background: var(--color-neutral-100);
    }

    .action-sheet-item:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-icon {
      width: 24px;
      height: 24px;
      font-size: 24px;
      flex-shrink: 0;
    }

    .action-label {
      flex: 1;
      line-height: 1.5;
    }

    .action-primary {
      color: var(--color-primary-600);
    }

    .action-primary .action-icon {
      color: var(--color-primary-600);
    }

    .action-accent {
      color: var(--color-secondary-600);
    }

    .action-accent .action-icon {
      color: var(--color-secondary-600);
    }

    .action-warn {
      color: var(--color-error-600);
    }

    .action-warn .action-icon {
      color: var(--color-error-600);
    }

    .action-success {
      color: var(--color-success-600);
    }

    .action-success .action-icon {
      color: var(--color-success-600);
    }

    .action-sheet-footer {
      padding: var(--spacing-3) var(--spacing-4);
      border-top: var(--border-width-1) solid var(--color-neutral-200);
      background: var(--color-neutral-50);
    }

    .action-sheet-cancel {
      width: 100%;
      padding: var(--spacing-4);
      border: none;
      background: var(--color-neutral-0);
      color: var(--color-neutral-700);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: background-color var(--duration-fast) var(--ease-out);
      min-height: 48px;
    }

    .action-sheet-cancel:hover {
      background: var(--color-neutral-100);
    }

    .action-sheet-cancel:active {
      background: var(--color-neutral-200);
    }

    ::ng-deep .mat-divider {
      margin: 0 var(--spacing-6);
    }
  `]
})
export class MobileActionSheetComponent {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: MobileActionSheetData,
    private bottomSheetRef: MatBottomSheetRef<MobileActionSheetComponent>
  ) {}

  onActionClick(action: MobileAction): void {
    if (!action.disabled) {
      this.bottomSheetRef.dismiss(action.action);
    }
  }

  onCancel(): void {
    this.bottomSheetRef.dismiss(null);
  }
}
