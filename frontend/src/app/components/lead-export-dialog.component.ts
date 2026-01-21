import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeadApiService, LeadExportRequest } from '../services/lead-api.service';
import { DossierStatus } from '../services/dossier-api.service';

interface ColumnOption {
  value: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-lead-export-dialog',
  templateUrl: './lead-export-dialog.component.html',
  styleUrls: ['./lead-export-dialog.component.css']
})
export class LeadExportDialogComponent {
  columns: ColumnOption[] = [
    { value: 'id', label: 'ID', selected: true },
    { value: 'leadName', label: 'Nom du prospect', selected: true },
    { value: 'leadPhone', label: 'Téléphone', selected: true },
    { value: 'leadSource', label: 'Source', selected: true },
    { value: 'status', label: 'Statut', selected: true },
    { value: 'annonceId', label: 'ID Annonce', selected: false },
    { value: 'annonceTitle', label: 'Titre Annonce', selected: false },
    { value: 'score', label: 'Score', selected: false },
    { value: 'createdAt', label: 'Date de création', selected: true },
    { value: 'updatedAt', label: 'Date de modification', selected: false },
    { value: 'createdBy', label: 'Créé par', selected: false },
    { value: 'updatedBy', label: 'Modifié par', selected: false }
  ];

  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  sourceFilter = '';
  
  isExporting = false;

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: DossierStatus.NEW, label: 'Nouveau' },
    { value: DossierStatus.QUALIFYING, label: 'En qualification' },
    { value: DossierStatus.QUALIFIED, label: 'Qualifié' },
    { value: DossierStatus.APPOINTMENT, label: 'Rendez-vous' },
    { value: DossierStatus.WON, label: 'Gagné' },
    { value: DossierStatus.LOST, label: 'Perdu' }
  ];

  constructor(
    public dialogRef: MatDialogRef<LeadExportDialogComponent>,
    private leadApiService: LeadApiService,
    private snackBar: MatSnackBar
  ) {}

  selectAllColumns(): void {
    this.columns.forEach(col => col.selected = true);
  }

  deselectAllColumns(): void {
    this.columns.forEach(col => col.selected = false);
  }

  getSelectedColumnsCount(): number {
    return this.columns.filter(col => col.selected).length;
  }

  canExport(): boolean {
    return this.getSelectedColumnsCount() > 0 && !this.isExporting;
  }

  exportLeads(): void {
    if (!this.canExport()) {
      this.snackBar.open('Veuillez sélectionner au moins une colonne', 'Fermer', { duration: 3000 });
      return;
    }

    this.isExporting = true;

    const selectedColumns = this.columns
      .filter(col => col.selected)
      .map(col => col.value);

    const request: LeadExportRequest = {
      columns: selectedColumns
    };

    if (this.statusFilter) {
      request.status = this.statusFilter;
    }
    if (this.dateFrom) {
      request.dateFrom = this.dateFrom;
    }
    if (this.dateTo) {
      request.dateTo = this.dateTo;
    }
    if (this.sourceFilter.trim()) {
      request.source = this.sourceFilter.trim();
    }

    this.leadApiService.exportLeads(request)
      .subscribe({
        next: (blob) => {
          this.downloadFile(blob);
          this.snackBar.open('Export réussi', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.isExporting = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isExporting = false;
          const message = err.error?.message || 'Échec de l\'export';
          this.snackBar.open(message, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private downloadFile(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    link.download = `leads_export_${timestamp}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }

  close(): void {
    if (!this.isExporting) {
      this.dialogRef.close(false);
    }
  }
}
