import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeadApiService } from '../services/lead-api.service';

export interface LeadImportError {
  row: number;
  field: string;
  message: string;
}

export interface LeadImportResponse {
  importJobId: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  validationErrors: LeadImportError[];
}

@Component({
  selector: 'app-lead-import-dialog',
  templateUrl: './lead-import-dialog.component.html',
  styleUrls: ['./lead-import-dialog.component.css']
})
export class LeadImportDialogComponent {
  selectedFile: File | null = null;
  duplicateStrategy: 'SKIP' | 'OVERWRITE' | 'CREATE_NEW' = 'SKIP';
  isDragging = false;
  isUploading = false;
  
  importResponse: LeadImportResponse | null = null;
  errors: LeadImportError[] = [];
  showErrors = false;

  constructor(
    public dialogRef: MatDialogRef<LeadImportDialogComponent>,
    private leadApiService: LeadApiService,
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  private validateAndSetFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.snackBar.open('Seuls les fichiers CSV sont acceptés', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('Le fichier ne doit pas dépasser 10 Mo', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.importResponse = null;
    this.errors = [];
    this.showErrors = false;
  }

  startImport(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Veuillez sélectionner un fichier', 'Fermer', { duration: 3000 });
      return;
    }

    this.isUploading = true;
    this.errors = [];
    this.showErrors = false;
    this.importResponse = null;

    this.leadApiService.importLeads(this.selectedFile, this.duplicateStrategy)
      .subscribe({
        next: (response) => {
          this.isUploading = false;
          this.importResponse = response;
          this.errors = response.validationErrors || [];
          
          if (response.errorCount > 0 || response.skippedCount > 0) {
            this.snackBar.open(
              `Import terminé: ${response.successCount} réussi(s), ${response.errorCount} erreur(s), ${response.skippedCount} ignoré(s)`,
              'Fermer',
              { duration: 5000, panelClass: ['warning-snackbar'] }
            );
          } else {
            this.snackBar.open(
              `Import terminé avec succès: ${response.successCount} prospect(s) importé(s)`,
              'Fermer',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
          }
        },
        error: (err) => {
          this.isUploading = false;
          const message = err.error?.message || 'Échec de l\'import';
          this.snackBar.open(message, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  toggleErrorsView(): void {
    this.showErrors = !this.showErrors;
  }

  getProgressPercentage(): number {
    if (!this.importResponse || this.importResponse.totalRows === 0) {
      return 0;
    }
    const processed = this.importResponse.successCount + this.importResponse.errorCount + this.importResponse.skippedCount;
    return Math.round((processed / this.importResponse.totalRows) * 100);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  canStartImport(): boolean {
    return !!this.selectedFile && !this.isUploading;
  }

  canClose(): boolean {
    return !this.isUploading;
  }

  close(): void {
    if (this.canClose()) {
      this.dialogRef.close(this.importResponse !== null);
    }
  }
}
