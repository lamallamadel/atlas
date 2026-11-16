import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

export interface ConfirmDeleteDialogData {
  title: string;
  message: string;
}

@Component({
    selector: 'app-confirm-delete-dialog',
    standalone: true,
    templateUrl: './confirm-delete-dialog.component.html',
    styleUrls: ['./confirm-delete-dialog.component.css'],
    imports: [
      CommonModule,
      DsButtonComponent,
      DsIconComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class ConfirmDeleteDialogComponent {
  isSubmitting = false;

  constructor(
    private dialogRef: DialogRef<boolean>,
    @Inject(DIALOG_DATA) public data: ConfirmDeleteDialogData
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
