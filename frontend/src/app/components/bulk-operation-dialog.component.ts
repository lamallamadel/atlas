import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

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
    
      @if (data.inProgress) {
        <mat-progress-bar
          mode="indeterminate">
        </mat-progress-bar>
      }
    
      @if (!data.inProgress) {
        <div class="results">
          <div class="result-summary">
            <div class="success-count">
              <mat-icon color="primary">check_circle</mat-icon>
              <span>{{ data.successCount }} réussi(s)</span>
            </div>
            @if (data.failureCount > 0) {
              <div class="failure-count">
                <mat-icon color="warn">error</mat-icon>
                <span>{{ data.failureCount }} échoué(s)</span>
              </div>
            }
          </div>
          @if (data.errors && data.errors.length > 0) {
            <div class="errors">
              <h3>Erreurs:</h3>
              <ul>
                @for (error of data.errors; track error) {
                  <li>
                    <strong>ID {{ error.id }}:</strong> {{ error.message }}
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      }
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
  `],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatProgressBar, MatIcon, MatDialogActions, MatButton, MatDialogClose]
})
export class BulkOperationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BulkOperationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BulkOperationDialogData
  ) {}
}
