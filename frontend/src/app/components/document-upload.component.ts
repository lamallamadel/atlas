import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DocumentApiService, DocumentCategory, DocumentResponse } from '../services/document-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface UploadProgress {
  file: File;
  progress: number;
  uploading: boolean;
  completed: boolean;
  error: string | null;
  response?: DocumentResponse;
}

@Component({
  selector: 'app-document-upload',
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.css']
})
export class DocumentUploadComponent {
  @Input() dossierId!: number;
  @Output() uploadComplete = new EventEmitter<DocumentResponse>();
  @Output() uploadError = new EventEmitter<string>();

  selectedFiles: File[] = [];
  uploadProgresses: Map<string, UploadProgress> = new Map();
  selectedCategory: string = '';
  isDragging = false;

  categories = [
    { value: '', label: 'Sélectionner une catégorie' },
    { value: DocumentCategory.CONTRACT, label: 'Contrat' },
    { value: DocumentCategory.INVOICE, label: 'Facture' },
    { value: DocumentCategory.ID, label: 'Pièce d\'identité' },
    { value: DocumentCategory.PHOTO, label: 'Photo' },
    { value: DocumentCategory.OTHER, label: 'Autre' }
  ];

  constructor(
    private documentApiService: DocumentApiService,
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(Array.from(input.files));
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
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private addFiles(files: File[]): void {
    this.selectedFiles = [...this.selectedFiles, ...files];
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  uploadFiles(): void {
    if (this.selectedFiles.length === 0) {
      this.snackBar.open('Aucun fichier sélectionné', 'Fermer', { duration: 3000 });
      return;
    }

    this.selectedFiles.forEach(file => {
      const key = this.getFileKey(file);
      this.uploadProgresses.set(key, {
        file,
        progress: 0,
        uploading: true,
        completed: false,
        error: null
      });

      this.documentApiService.upload(this.dossierId, file, this.selectedCategory || undefined)
        .subscribe({
          next: (event) => {
            const progress = this.uploadProgresses.get(key);
            if (!progress) return;

            if (event.type === HttpEventType.UploadProgress && event.total) {
              progress.progress = Math.round((100 * event.loaded) / event.total);
            } else if (event.type === HttpEventType.Response) {
              progress.uploading = false;
              progress.completed = true;
              progress.progress = 100;
              progress.response = event.body as DocumentResponse;
              
              this.snackBar.open(`${file.name} téléchargé avec succès`, 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });

              this.uploadComplete.emit(event.body as DocumentResponse);
              
              setTimeout(() => {
                this.uploadProgresses.delete(key);
                const fileIndex = this.selectedFiles.indexOf(file);
                if (fileIndex > -1) {
                  this.selectedFiles.splice(fileIndex, 1);
                }
              }, 2000);
            }
          },
          error: (error) => {
            const progress = this.uploadProgresses.get(key);
            if (progress) {
              progress.uploading = false;
              progress.completed = false;
              progress.error = error.error?.message || 'Échec du téléchargement';
              
              this.snackBar.open(`Erreur: ${progress.error}`, 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });

              if (progress.error) {
                this.uploadError.emit(progress.error);
              }
            }
          }
        });
    });
  }

  private getFileKey(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }

  getUploadProgressArray(): UploadProgress[] {
    return Array.from(this.uploadProgresses.values());
  }

  getFileIcon(file: File): string {
    return this.documentApiService.getFileIcon(file.name, file.type);
  }

  formatFileSize(bytes: number): string {
    return this.documentApiService.formatFileSize(bytes);
  }

  hasSelectedFiles(): boolean {
    return this.selectedFiles.length > 0;
  }

  isUploading(): boolean {
    return Array.from(this.uploadProgresses.values()).some(p => p.uploading);
  }
}
