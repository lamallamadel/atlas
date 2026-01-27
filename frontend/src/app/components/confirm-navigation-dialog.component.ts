import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-navigation-dialog',
  template: `
    <h2 mat-dialog-title>Modifications non enregistrées</h2>
    <mat-dialog-content>
      <p>Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter cette page ?</p>
      <p class="warning-text">
        <mat-icon class="warning-icon">warning</mat-icon>
        Vos modifications seront perdues si vous continuez.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" color="primary">
        Rester sur la page
      </button>
      <button mat-raised-button (click)="onConfirm()" color="warn">
        Quitter sans enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warning-text {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f57c00;
      margin-top: 16px;
      font-weight: 500;
    }

    .warning-icon {
      vertical-align: middle;
    }

    mat-dialog-content {
      padding: 16px 0;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
    }
  `]
})
export class ConfirmNavigationDialogComponent {
  
  constructor(private dialogRef: MatDialogRef<ConfirmNavigationDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
