import { Component, inject } from '@angular/core';
import { DsDialogService } from '../../design-system';
import { LeadImportDialogComponent } from '../../components/lead-import-dialog.component';
import { LeadExportDialogComponent } from '../../components/lead-export-dialog.component';
import { CommonModule } from '@angular/common';
import { DsButtonComponent, DsIconComponent, DsToastService } from '../../design-system';

@Component({
  selector: 'app-lead-management-example',
  standalone: true,
  template: `
    <div class="lead-management-toolbar ds-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: var(--ds-surface); border-radius: var(--ds-radius-md); margin-bottom: 24px; border: 1px solid var(--ds-border);">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--ds-marine);">Gestion des Prospects</h2>
      <div class="actions" style="display: flex; gap: 12px;">
        <ds-button variant="marine" size="md" (dsClick)="openImportDialog()">
          <ds-icon name="upload" [size]="16" style="margin-right: 8px;"></ds-icon>
          Importer des prospects
        </ds-button>
        <ds-button variant="ghost" size="md" (dsClick)="openExportDialog()">
          <ds-icon name="download" [size]="16" style="margin-right: 8px;"></ds-icon>
          Exporter des prospects
        </ds-button>
      </div>
    </div>
  `,
  imports: [CommonModule, DsButtonComponent, DsIconComponent]
})
export class LeadManagementExampleComponent {
  private dialog = inject(DsDialogService);
  private toastService = inject(DsToastService);

  openImportDialog(): void {
    const dialogRef = this.dialog.open(LeadImportDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'lead-import-dialog-container'
    });

    dialogRef.closed.subscribe((result: boolean) => {
      if (result) {
        this.toastService.success('Import terminé. Rafraîchissement de la liste...');
      }
    });
  }

  openExportDialog(): void {
    const dialogRef = this.dialog.open(LeadExportDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'lead-export-dialog-container'
    });

    dialogRef.closed.subscribe((result: boolean) => {
      if (result) {
        this.toastService.success('Export terminé avec succès');
      }
    });
  }
}
