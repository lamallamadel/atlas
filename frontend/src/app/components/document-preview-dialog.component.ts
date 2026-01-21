import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentApiService, DocumentResponse } from '../services/document-api.service';

export interface DocumentPreviewDialogData {
  document: DocumentResponse;
}

@Component({
  selector: 'app-document-preview-dialog',
  templateUrl: './document-preview-dialog.component.html',
  styleUrls: ['./document-preview-dialog.component.css']
})
export class DocumentPreviewDialogComponent implements OnInit {
  previewUrl: SafeResourceUrl | null = null;
  loading = true;
  error: string | null = null;
  isImage = false;
  isPdf = false;

  constructor(
    public dialogRef: MatDialogRef<DocumentPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentPreviewDialogData,
    private documentApiService: DocumentApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadPreview();
  }

  loadPreview(): void {
    this.loading = true;
    this.error = null;

    const contentType = this.data.document.contentType;
    this.isImage = contentType.startsWith('image/');
    this.isPdf = contentType === 'application/pdf';

    this.documentApiService.download(this.data.document.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Échec du chargement de l\'aperçu';
          this.loading = false;
          console.error('Error loading preview:', err);
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  download(): void {
    this.documentApiService.download(this.data.document.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = window.document.createElement('a');
          link.href = url;
          link.download = this.data.document.fileName;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Error downloading document:', err);
        }
      });
  }

  formatFileSize(bytes: number): string {
    return this.documentApiService.formatFileSize(bytes);
  }
}
