import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LeadApiService } from '../services/lead-api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsRadioGroupComponent, 
  DsRadioOption,
  DsSkeletonComponent,
  DsCardComponent,
  DsBadgeComponent,
  DsProgressBarComponent,
  DsToastService,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

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
    standalone: true,
    templateUrl: './lead-import-dialog.component.html',
    styleUrls: ['./lead-import-dialog.component.css'],
    imports: [
      CommonModule,
      FormsModule, 
      DsButtonComponent,
      DsIconComponent,
      DsRadioGroupComponent,
      DsCardComponent,
      DsProgressBarComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class LeadImportDialogComponent {
  private leadApiService = inject(LeadApiService);
  private toastService = inject(DsToastService);

  selectedFile: File | null = null;
  duplicateStrategy: 'SKIP' | 'OVERWRITE' | 'CREATE_NEW' = 'SKIP';
  isDragging = false;
  isUploading = false;
  
  importResponse: LeadImportResponse | null = null;
  errors: LeadImportError[] = [];
  showErrors = false;

  readonly strategyOptions: DsRadioOption[] = [
    { value: 'SKIP', label: 'Ignorer les doublons', description: 'Ne pas importer si un prospect avec le même téléphone existe.' },
    { value: 'OVERWRITE', label: 'Écraser les doublons', description: 'Mettre à jour les informations du prospect existant.' },
    { value: 'CREATE_NEW', label: 'Créer de nouveaux prospects', description: 'Importer même si un doublon potentiel est détecté.' }
  ];

  constructor(
    public dialogRef: DialogRef<any>
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
      this.toastService.error('Seuls les fichiers CSV sont acceptés');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('Le fichier ne doit pas dépasser 10 Mo');
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
      this.toastService.warning('Veuillez sélectionner un fichier');
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
            this.toastService.warning(
              `Import terminé: ${response.successCount} réussi(s), ${response.errorCount} erreur(s), ${response.skippedCount} ignoré(s)`
            );
          } else {
            this.toastService.success(
              `Import terminé avec succès: ${response.successCount} prospect(s) importé(s)`
            );
          }
        },
        error: (err) => {
          this.isUploading = false;
          const message = err.error?.message || 'Échec de l\'import';
          this.toastService.error(message);
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
