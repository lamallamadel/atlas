import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsProgressBarComponent,
  DsBadgeComponent,
  DsCardComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

export interface BulkOperationDialogData {
  title: string;
  message: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
  errors: Array<{ id: number; message: string }>;
  inProgress: boolean;
}

@Component({
    selector: 'app-bulk-operation-dialog',
    standalone: true,
    template: `
    <ds-dialog-header (close)="close()">
      <div style="display: flex; align-items: center; gap: 12px;">
        <ds-icon name="tasks" [size]="24" aria-hidden="true"></ds-icon>
        <span>{{ data.title }}</span>
      </div>
    </ds-dialog-header>
    
    <ds-dialog-content>
      <p style="margin-bottom: 24px; color: var(--ds-text);">{{ data.message }}</p>
    
      @if (data.inProgress) {
        <div class="progress-container ds-form-stack" style="margin: 32px 0;">
          <ds-progress-bar mode="indeterminate" variant="primary"></ds-progress-bar>
          <p style="text-align: center; font-size: 13px; color: var(--ds-text-muted);">Opérations en cours...</p>
        </div>
      }
    
      @if (!data.inProgress) {
        <div class="results ds-form-stack">
          <div class="result-summary" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
            <ds-card [pad]="true" elevation="xs" style="text-align: center; background: var(--ds-success-hl);">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--ds-success); margin-bottom: 4px; font-weight: 700;">Réussi(s)</div>
              <strong style="font-size: 24px; color: var(--ds-success);">{{ data.successCount }}</strong>
            </ds-card>
            
            <ds-card [pad]="true" elevation="xs" style="text-align: center; background: var(--ds-error-hl);">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--ds-error); margin-bottom: 4px; font-weight: 700;">Échoué(s)</div>
              <strong style="font-size: 24px; color: var(--ds-error);">{{ data.failureCount }}</strong>
            </ds-card>
          </div>

          @if (data.errors && data.errors.length > 0) {
            <div class="errors-list ds-form-stack">
              <h4 style="font-size: 13px; font-weight: 700; color: var(--ds-error); margin-bottom: 12px;">Détails des erreurs</h4>
              <div class="error-items ds-form-stack" style="max-height: 300px; overflow-y: auto; padding-right: 8px;">
                @for (error of data.errors; track error.id) {
                  <div class="error-item" style="padding: 12px; border-radius: 6px; border: 1px solid var(--ds-error-hl); background: var(--ds-surface); display: flex; gap: 12px; align-items: flex-start;">
                    <ds-icon name="info" [size]="16" style="color: var(--ds-error); margin-top: 2px;"></ds-icon>
                    <div class="error-content">
                      <strong style="font-size: 12px; display: block; margin-bottom: 2px;">ID {{ error.id }}</strong>
                      <span style="font-size: 13px; color: var(--ds-text);">{{ error.message }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </ds-dialog-content>
    
    <ds-dialog-actions align="end">
      <ds-button variant="marine" size="md" (dsClick)="close()" [disabled]="data.inProgress">
        Fermer
      </ds-button>
    </ds-dialog-actions>
    `,
    imports: [
      CommonModule,
      DsButtonComponent,
      DsIconComponent,
      DsProgressBarComponent,
      DsBadgeComponent,
      DsCardComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class BulkOperationDialogComponent {
  constructor(
    public dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) public data: BulkOperationDialogData
  ) {}

  close(): void {
    if (!this.data.inProgress) {
      this.dialogRef.close(true);
    }
  }
}
