import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExportService, ExportProgress } from '../services/export.service';
import { Subscription } from 'rxjs';

export interface ExportProgressDialogData {
  message: string;
}

@Component({
  selector: 'app-export-progress-dialog',
  template: `
    <div class="export-progress-dialog">
      <h2 mat-dialog-title>
        <mat-icon class="title-icon">{{getTitleIcon()}}</mat-icon>
        {{ getTitle() }}
      </h2>
      
      <mat-dialog-content>
        <div class="progress-container">
          <mat-progress-bar 
            mode="determinate" 
            [value]="progress?.progress || 0"
            [color]="getProgressColor()">
          </mat-progress-bar>
          
          <div class="progress-message">
            <mat-icon *ngIf="progress?.stage === 'complete'" class="success-icon">check_circle</mat-icon>
            <mat-icon *ngIf="progress?.stage === 'error'" class="error-icon">error</mat-icon>
            <span>{{ progress?.message || data.message }}</span>
          </div>

          <div *ngIf="progress && progress.error" class="error-details">
            {{ progress.error }}
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button 
          mat-button 
          (click)="close()"
          [disabled]="progress?.stage === 'preparing' || progress?.stage === 'generating'">
          {{ progress?.stage === 'complete' ? 'Fermer' : 'Annuler' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .export-progress-dialog {
      min-width: 400px;
      max-width: 500px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 16px 24px;
      color: #2c5aa0;
    }

    .title-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    mat-dialog-content {
      padding: 24px;
      min-height: 120px;
    }

    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    mat-progress-bar {
      height: 8px;
      border-radius: 4px;
    }

    .progress-message {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #333;
    }

    .success-icon {
      color: #4caf50;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .error-icon {
      color: #e74c3c;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .error-details {
      padding: 12px;
      background-color: #ffebee;
      border-left: 4px solid #e74c3c;
      border-radius: 4px;
      font-size: 13px;
      color: #c62828;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class ExportProgressDialogComponent implements OnDestroy {
  progress: ExportProgress | null = null;
  private progressSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<ExportProgressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportProgressDialogData,
    private exportService: ExportService
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
      case 'preparing':
        return 'Préparation...';
      case 'generating':
        return 'Génération...';
      case 'complete':
        return 'Export terminé !';
      case 'error':
        return 'Erreur d\'export';
      default:
        return 'Export en cours...';
    }
  }

  getTitleIcon(): string {
    if (!this.progress) return 'cloud_upload';
    
    switch (this.progress.stage) {
      case 'preparing':
        return 'hourglass_empty';
      case 'generating':
        return 'sync';
      case 'complete':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'cloud_upload';
    }
  }

  getProgressColor(): 'primary' | 'accent' | 'warn' {
    if (!this.progress) return 'primary';
    
    switch (this.progress.stage) {
      case 'error':
        return 'warn';
      case 'complete':
        return 'accent';
      default:
        return 'primary';
    }
  }
}
