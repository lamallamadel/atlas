import { Component, Inject, OnDestroy, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ExportService, ExportProgress } from '../services/export.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsProgressBarComponent,
  DsProgressBarVariant,
  DsCardComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

export interface ExportProgressDialogData {
  message: string;
}

@Component({
    selector: 'app-export-progress-dialog',
    standalone: true,
    template: `
    <ds-dialog-header (close)="close()">
      <div style="display: flex; align-items: center; gap: 12px;">
        <ds-icon [name]="getTitleIcon()" [size]="24" [style.color]="getIconColor()"></ds-icon>
        <span>{{ getTitle() }}</span>
      </div>
    </ds-dialog-header>

    <ds-dialog-content>
      <div class="progress-container ds-form-stack">
        <ds-progress-bar
          mode="determinate"
          [value]="progress?.progress || 0"
          [variant]="getProgressVariant()">
        </ds-progress-bar>
    
        <div class="progress-message" style="display: flex; align-items: center; gap: 12px; margin-top: 16px;">
          @if (progress?.stage === 'complete') {
            <ds-icon name="check" [size]="20" style="color: var(--ds-success);"></ds-icon>
          }
          @if (progress?.stage === 'error') {
            <ds-icon name="info" [size]="20" style="color: var(--ds-error);"></ds-icon>
          }
          <span style="font-size: 14px; color: var(--ds-text);">{{ progress?.message || data.message }}</span>
        </div>
    
        @if (progress && progress.error) {
          <ds-card [pad]="true" elevation="xs" style="margin-top: 16px; background: var(--ds-error-hl); border: 1px solid var(--ds-error);">
            <div style="font-size: 13px; color: var(--ds-error); font-weight: 500;">
              {{ progress.error }}
            </div>
          </ds-card>
        }
      </div>
    </ds-dialog-content>

    <ds-dialog-actions align="end">
      <ds-button
        variant="ghost"
        size="md"
        (dsClick)="close()"
        [disabled]="progress?.stage === 'preparing' || progress?.stage === 'generating'">
        {{ progress?.stage === 'complete' ? 'Fermer' : 'Annuler' }}
      </ds-button>
    </ds-dialog-actions>
    `,
    imports: [
      CommonModule,
      DsButtonComponent, 
      DsIconComponent, 
      DsProgressBarComponent,
      DsCardComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class ExportProgressDialogComponent implements OnDestroy {
  private exportService = inject(ExportService);
  
  progress: ExportProgress | null = null;
  private progressSubscription: Subscription;

  constructor(
    public dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) public data: ExportProgressDialogData
  ) {
    this.progressSubscription = this.exportService.progress$.subscribe(
      progress => {
        this.progress = progress;
        
        if (progress.stage === 'complete') {
          setTimeout(() => this.close(), 2000);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.progressSubscription.unsubscribe();
  }

  close(): void {
    this.dialogRef.close();
  }

  getTitle(): string {
    if (!this.progress) return 'Export en cours...';
    
    switch (this.progress.stage) {
      case 'preparing': return 'Préparation...';
      case 'generating': return 'Génération...';
      case 'complete': return 'Export terminé !';
      case 'error': return 'Erreur d\'export';
      default: return 'Export en cours...';
    }
  }

  getTitleIcon(): string {
    if (!this.progress) return 'upload';
    
    switch (this.progress.stage) {
      case 'preparing': return 'clock';
      case 'generating': return 'refresh';
      case 'complete': return 'check';
      case 'error': return 'info';
      default: return 'upload';
    }
  }

  getIconColor(): string {
    if (!this.progress) return 'var(--ds-marine)';
    switch (this.progress.stage) {
      case 'complete': return 'var(--ds-success)';
      case 'error': return 'var(--ds-error)';
      default: return 'var(--ds-marine)';
    }
  }

  getProgressVariant(): DsProgressBarVariant {
    if (!this.progress) return 'primary';
    
    switch (this.progress.stage) {
      case 'error': return 'error';
      case 'complete': return 'success';
      default: return 'primary';
    }
  }
}
