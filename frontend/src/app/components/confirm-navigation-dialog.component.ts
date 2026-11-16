import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

@Component({
    selector: 'app-confirm-navigation-dialog',
    standalone: true,
    template: `
    <ds-dialog-header (close)="onCancel()">
      <div style="display: flex; align-items: center; gap: 12px;">
        <ds-icon name="info" [size]="24" style="color: var(--ds-warning);"></ds-icon>
        <span>Modifications non enregistrées</span>
      </div>
    </ds-dialog-header>

    <ds-dialog-content>
      <div class="ds-form-stack">
        <p style="margin: 0; color: var(--ds-text);">Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter cette page ?</p>
        
        <div style="display: flex; align-items: center; gap: 12px; background: var(--ds-warning-hl); padding: 12px; border-radius: var(--ds-radius-md); border-left: 4px solid var(--ds-warning); margin-top: 16px;">
          <ds-icon name="info" [size]="20" style="color: var(--ds-warning-dark);"></ds-icon>
          <span style="font-size: 13px; font-weight: 600; color: var(--ds-warning-dark);">Vos modifications seront perdues si vous continuez.</span>
        </div>
      </div>
    </ds-dialog-content>

    <ds-dialog-actions align="end">
      <ds-button variant="ghost" size="md" (dsClick)="onCancel()">
        Rester sur la page
      </ds-button>
      <ds-button variant="danger" size="md" (dsClick)="onConfirm()">
        Quitter sans enregistrer
      </ds-button>
    </ds-dialog-actions>
  `,
    imports: [
      CommonModule,
      DsButtonComponent, 
      DsIconComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class ConfirmNavigationDialogComponent {
  private dialogRef = inject(DialogRef<boolean>);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
