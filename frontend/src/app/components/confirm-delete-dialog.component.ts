import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { dialogSlideUp, shakeX } from '../animations';
import { FocusTrapDirective } from '../directives/focus-trap.directive';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

export interface ConfirmDeleteDialogData {
  title: string;
  message: string;
}

@Component({
    selector: 'app-confirm-delete-dialog',
    templateUrl: './confirm-delete-dialog.component.html',
    styleUrls: ['./confirm-delete-dialog.component.css'],
    animations: [dialogSlideUp, shakeX],
    imports: [FocusTrapDirective, MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions, MatButton, MatProgressSpinner]
})
export class ConfirmDeleteDialogComponent {
  isSubmitting = false;

  constructor(
    private dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    if (!this.isSubmitting) {
      this.isSubmitting = true;
      this.dialogRef.close(true);
    }
  }
}
