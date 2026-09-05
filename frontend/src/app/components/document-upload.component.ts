import { Component, input, output, inject, signal, computed } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DocumentApiService, DocumentCategory, DocumentResponse } from '../services/document-api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsSkeletonComponent,
  DsProgressBarComponent,
  DsToastService
} from '../design-system';

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
    standalone: true,
    templateUrl: './document-upload.component.html',
    styleUrls: ['./document-upload.component.css'],
    imports: [
      CommonModule,
      FormsModule, 
      DsButtonComponent,
      DsIconComponent,
      DsSelectComponent,
      DsSkeletonComponent,
      DsProgressBarComponent
    ]
})
export class DocumentUploadComponent {
  private documentApiService = inject(DocumentApiService);
  private toastService = inject(DsToastService);

  readonly dossierId = input.required<number>();
  readonly uploadComplete = output<DocumentResponse>();

  selectedFiles: File[] = [];
  uploadProgressMap = signal<Map<string, UploadProgress>>(new Map());
  isDragging = false;
  selectedCategory: DocumentCategory = DocumentCategory.OTHER;

  readonly categories: DsSelectOption[] = [
    { value: 'ID', label: 'Pièce d\'identité' },
    { value: 'Contract', label: 'Contrat / Offre' },
    { value: 'Invoice', label: 'Justificatif / Facture' },
    { value: 'Photo', label: 'Photo de bien' },
    { value: 'Other', label: 'Autre' }
  ];

  isUploading = computed(() => {
    return Array.from(this.uploadProgressMap().values()).some(p => p.uploading);
  });

  hasSelectedFiles = computed(() => this.selectedFiles.length > 0);

  getUploadProgressArray = computed(() => {
    return Array.from(this.uploadProgressMap().values());
  });

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    this.addFiles(files);
  }

  private addFiles(files: FileList | File[]): void {
    for (let i = 0; i < files.length; i++) {
      this.selectedFiles.push(files[i]);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
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

    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  uploadFiles(): void {
    const filesToUpload = [...this.selectedFiles];
    this.selectedFiles = [];

    filesToUpload.forEach(file => {
      const progressKey = `${file.name}-${file.size}-${Date.now()}`;
      const progress: UploadProgress = {
        file,
        progress: 0,
        uploading: true,
        completed: false,
        error: null
      };

      this.updateProgress(progressKey, progress);

      this.documentApiService.upload(this.dossierId(), file, this.selectedCategory)
        .subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress) {
              const currentProgress = Math.round((100 * event.loaded) / (event.total || 100));
              this.updateProgress(progressKey, { ...progress, progress: currentProgress });
            } else if (event.type === HttpEventType.Response) {
              const response = event.body as DocumentResponse;
              this.updateProgress(progressKey, { 
                ...progress, 
                progress: 100, 
                uploading: false, 
                completed: true, 
                response 
              });
              this.uploadComplete.emit(response);
              this.toastService.success(`Document "${file.name}" téléchargé avec succès`);
            }
          },
          error: (err) => {
            this.updateProgress(progressKey, { 
              ...progress, 
              uploading: false, 
              error: err.error?.message || 'Échec du téléchargement' 
            });
            this.toastService.error(`Erreur lors du téléchargement de "${file.name}"`);
          }
        });
    });
  }

  private updateProgress(key: string, progress: UploadProgress): void {
    const map = new Map(this.uploadProgressMap());
    map.set(key, progress);
    this.uploadProgressMap.set(map);
  }

  formatFileSize(bytes: number): string {
    return this.documentApiService.formatFileSize(bytes);
  }
}
