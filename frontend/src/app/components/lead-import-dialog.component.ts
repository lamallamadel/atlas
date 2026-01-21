import { Component, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeadApiService, LeadImportJobResponse, LeadImportError } from '../services/lead-api.service';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-lead-import-dialog',
  templateUrl: './lead-import-dialog.component.html',
  styleUrls: ['./lead-import-dialog.component.css']
})
export class LeadImportDialogComponent implements OnDestroy {
  selectedFile: File | null = null;
  duplicateStrategy: 'SKIP' | 'OVERWRITE' | 'CREATE_NEW' = 'SKIP';
  isDragging = false;
  isUploading = false;
  
  jobId: string | null = null;
  importStatus: LeadImportJobResponse | null = null;
  pollingSubscription: Subscription | null = null;
  
  errors: LeadImportError[] = [];
  showErrors = false;

  constructor(
    public dialogRef: MatDialogRef<LeadImportDialogComponent>,
    private leadApiService: LeadApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnDestroy(): void {
    this.stopPolling();
  }

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
  }

  startImport(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Veuillez sélectionner un fichier', 'Fermer', { duration: 3000 });
      return;
    }

    this.isUploading = true;
    this.errors = [];
    this.showErrors = false;

    this.leadApiService.importLeads(this.selectedFile, this.duplicateStrategy)
      .subscribe({
        next: (response) => {
          this.jobId = response.jobId;
          this.importStatus = response;
          this.startPolling();
          this.snackBar.open('Import démarré avec succès', 'Fermer', { duration: 3000 });
        },
        error: (err) => {
          this.isUploading = false;
          const message = err.error?.message || 'Échec du démarrage de l\'import';
          this.snackBar.open(message, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private startPolling(): void {
    if (!this.jobId) return;

    this.pollingSubscription = interval(2000)
      .pipe(
        switchMap(() => this.leadApiService.getImportStatus(this.jobId!)),
        takeWhile(status => {
          return status.status === 'PENDING' || status.status === 'PROCESSING';
        }, true)
      )
      .subscribe({
        next: (status) => {
          this.importStatus = status;
          
          if (status.status === 'COMPLETED' || status.status === 'FAILED') {
            this.isUploading = false;
            this.errors = status.errors || [];
            
            if (status.status === 'COMPLETED') {
              this.snackBar.open(
                `Import terminé: ${status.successCount} réussi(s), ${status.failureCount} échoué(s)`,
                'Fermer',
                { duration: 5000, panelClass: ['success-snackbar'] }
              );
            } else {
              this.snackBar.open('L\'import a échoué', 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
            
            this.stopPolling();
          }
        },
        error: (err) => {
          this.isUploading = false;
          this.snackBar.open('Erreur lors de la vérification du statut', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.stopPolling();
        }
      });
  }

  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  toggleErrorsView(): void {
    this.showErrors = !this.showErrors;
  }

  getProgressPercentage(): number {
    if (!this.importStatus || this.importStatus.totalRows === 0) {
      return 0;
    }
    return Math.round((this.importStatus.processedRows / this.importStatus.totalRows) * 100);
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
      this.dialogRef.close(this.importStatus?.status === 'COMPLETED');
    }
  }
}
