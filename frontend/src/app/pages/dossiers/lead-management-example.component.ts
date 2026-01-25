import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeadImportDialogComponent } from '../../components/lead-import-dialog.component';
import { LeadExportDialogComponent } from '../../components/lead-export-dialog.component';

@Component({
  selector: 'app-lead-management-example',
  template: `
    <div class="lead-management-toolbar">
      <h2>Gestion des Prospects</h2>
      <div class="actions">
        <button mat-raised-button color="primary" (click)="openImportDialog()">
          <mat-icon>upload_file</mat-icon>
          Importer des prospects
        </button>
        <button mat-raised-button (click)="openExportDialog()">
          <mat-icon>download</mat-icon>
          Exporter des prospects
        </button>
      </div>
    </div>
  `,
  styles: [`
    .lead-management-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .lead-management-toolbar h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .actions {
      display: flex;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .lead-management-toolbar {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .actions {
        width: 100%;
        flex-direction: column;
      }

      .actions button {
        width: 100%;
      }
    }
  `]
})
export class LeadManagementExampleComponent {
  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  openImportDialog(): void {
    const dialogRef = this.dialog.open(LeadImportDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'lead-import-dialog-container'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.snackBar.open('Import terminé. Rafraîchissement de la liste...', 'OK', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        // Refresh your lead list here
        // this.loadLeads();
      }
    });
  }

  openExportDialog(): void {
    const dialogRef = this.dialog.open(LeadExportDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'lead-export-dialog-container'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.snackBar.open('Export terminé avec succès', 'OK', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }
}
