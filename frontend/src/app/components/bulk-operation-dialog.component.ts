import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      
      <mat-progress-bar 
        *ngIf="data.inProgress" 
        mode="indeterminate">
      </mat-progress-bar>
      
      <div *ngIf="!data.inProgress" class="results">
        <div class="result-summary">
          <div class="success-count">
            <mat-icon color="primary">check_circle</mat-icon>
            <span>{{ data.successCount }} réussi(s)</span>
          </div>
          <div class="failure-count" *ngIf="data.failureCount > 0">
            <mat-icon color="warn">error</mat-icon>
            <span>{{ data.failureCount }} échoué(s)</span>
          </div>
        </div>
        
        <div *ngIf="data.errors && data.errors.length > 0" class="errors">
          <h3>Erreurs:</h3>
          <ul>
            <li *ngFor="let error of data.errors">
              <strong>ID {{ error.id }}:</strong> {{ error.message }}
            </li>
          </ul>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="true" [disabled]="data.inProgress">
        Fermer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .results {
      margin-top: 16px;
    }
    
    .result-summary {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }
    
    .success-count,
    .failure-count {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .errors {
      margin-top: 16px;
      padding: 16px;
      background-color: #ffebee;
      border-radius: 4px;
    }
    
    .errors h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
    }
    
    .errors ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .errors li {
      margin: 4px 0;
      font-size: 13px;
    }
    
    mat-progress-bar {
      margin: 16px 0;
    }
  `]
})
export class BulkOperationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BulkOperationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BulkOperationDialogData
  ) {}
}
