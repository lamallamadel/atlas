import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../design-system';

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
    standalone: true,
    template: `
    <div class="mobile-action-sheet">
      @if (data.title || data.subtitle) {
        <div class="action-sheet-header">
          <div class="action-sheet-drag-handle"></div>
          @if (data.title) {
            <h2 class="action-sheet-title">{{ data.title }}</h2>
          }
          @if (data.subtitle) {
            <p class="action-sheet-subtitle">{{ data.subtitle }}</p>
          }
        </div>
      }
    
      <div class="action-sheet-content">
        @for (action of data.actions; track action; let last = $last) {
          <button
            class="action-sheet-item"
            [class.action-primary]="action.color === 'primary'"
            [class.action-accent]="action.color === 'accent'"
            [class.action-warn]="action.color === 'warn'"
            [class.action-success]="action.color === 'success'"
            [disabled]="action.disabled"
            (click)="onActionClick(action)"
            [attr.aria-label]="action.label">
            <ds-icon class="action-icon" [name]="action.icon" [size]="24" aria-hidden="true"></ds-icon>
            <span class="action-label">{{ action.label }}</span>
          </button>
          @if (action.divider && !last) {
            <div class="action-sheet-divider"></div>
          }
        }
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
      background: var(--ds-surface);
      max-height: 80vh;
      overflow: hidden;
    }

    .action-sheet-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--ds-space-4) var(--ds-space-6) var(--ds-space-2);
      border-bottom: 1px solid var(--ds-divider);
      position: relative;
    }

    .action-sheet-drag-handle {
      width: 40px;
      height: 4px;
      background: var(--ds-border);
      border-radius: var(--ds-radius-pill);
      margin-bottom: var(--ds-space-3);
    }

    .action-sheet-title {
      margin: 0 0 var(--ds-space-1) 0;
      font-size: var(--ds-text-lg);
      font-weight: 600;
      color: var(--ds-text);
      text-align: center;
    }

    .action-sheet-subtitle {
      margin: 0;
      font-size: var(--ds-text-sm);
      color: var(--ds-text-muted);
      text-align: center;
    }

    .action-sheet-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--ds-space-2) 0;
      -webkit-overflow-scrolling: touch;
    }

    .action-sheet-item {
      display: flex;
      align-items: center;
      gap: var(--ds-space-4);
      width: 100%;
      padding: var(--ds-space-4) var(--ds-space-6);
      border: none;
      background: var(--ds-surface);
      color: var(--ds-text);
      font-size: var(--ds-text-base);
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: background-color 150ms ease;
      min-height: 56px;
    }

    .action-sheet-item:hover:not(:disabled) {
      background: var(--ds-surface-2);
    }

    .action-sheet-item:active:not(:disabled) {
      background: var(--ds-bg);
    }

    .action-sheet-item:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-icon {
      flex-shrink: 0;
    }

    .action-label {
      flex: 1;
      line-height: 1.5;
    }

    .action-primary { color: var(--ds-marine); }
    .action-accent { color: var(--ds-primary); }
    .action-warn { color: var(--ds-error); }
    .action-success { color: var(--ds-success); }

    .action-sheet-divider {
      height: 1px;
      background: var(--ds-divider);
      margin: 0 var(--ds-space-6);
    }

    .action-sheet-footer {
      padding: var(--ds-space-3) var(--ds-space-4);
      border-top: 1px solid var(--ds-divider);
      background: var(--ds-surface-2);
    }

    .action-sheet-cancel {
      width: 100%;
      padding: var(--ds-space-4);
      border: none;
      background: var(--ds-surface);
      color: var(--ds-text-muted);
      font-size: var(--ds-text-base);
      font-weight: 600;
      border-radius: var(--ds-radius-lg);
      cursor: pointer;
      transition: background-color 150ms ease;
      min-height: 48px;
    }

    .action-sheet-cancel:hover { background: var(--ds-bg); }
    .action-sheet-cancel:active { background: var(--ds-divider); }
  `],
    imports: [CommonModule, DsIconComponent]
})
export class MobileActionSheetComponent {
  constructor(
    @Inject(DIALOG_DATA) public data: MobileActionSheetData,
    private dialogRef: DialogRef<string | null>
  ) {}

  onActionClick(action: MobileAction): void {
    if (!action.disabled) {
      this.dialogRef.close(action.action);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
