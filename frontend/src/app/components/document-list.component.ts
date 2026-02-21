import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentApiService, DocumentResponse } from '../services/document-api.service';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { DocumentPreviewDialogComponent } from './document-preview-dialog.component';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})
export class DocumentListComponent implements OnInit {
  @Input() dossierId!: number;

  documents: DocumentResponse[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private documentApiService: DocumentApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    if (!this.dossierId) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.documentApiService.listByDossier(this.dossierId, 0, 100)
      .subscribe({
        next: (response) => {
          this.documents = response.content;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Échec du chargement des documents';
          this.loading = false;
          console.error('Error loading documents:', err);
        }
      });
  }

  onUploadComplete(document: DocumentResponse): void {
    this.documents = [document, ...this.documents];
  }

  previewDocument(document: DocumentResponse): void {
    if (this.documentApiService.isPreviewable(document.contentType)) {
      this.dialog.open(DocumentPreviewDialogComponent, {
        width: '90vw',
        maxWidth: '1200px',
        height: '90vh',
        panelClass: 'document-preview-dialog',
        data: { document }
      });
    } else {
      this.snackBar.open('Aperçu non disponible pour ce type de fichier', 'Fermer', {
        duration: 3000
      });
    }
  }

  downloadDocument(doc: DocumentResponse): void {
    this.documentApiService.download(doc.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = window.document.createElement('a');
          link.href = url;
          link.download = doc.fileName;
          link.click();
          window.URL.revokeObjectURL(url);

          this.snackBar.open('Téléchargement démarré', 'Fermer', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        },
        error: (err) => {
          this.snackBar.open('Échec du téléchargement', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          console.error('Error downloading document:', err);
        }
      });
  }

  deleteDocument(document: DocumentResponse): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le document',
        message: `Êtes-vous sûr de vouloir supprimer "${document.fileName}" ? Cette action est irréversible.`
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.documentApiService.delete(document.id)
          .subscribe({
            next: () => {
              this.documents = this.documents.filter(d => d.id !== document.id);
              this.snackBar.open('Document supprimé avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
            },
            error: (err) => {
              this.snackBar.open('Échec de la suppression', 'Fermer', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
              console.error('Error deleting document:', err);
            }
          });
      }
    });
  }

  getFileIcon(document: DocumentResponse): string {
    return this.documentApiService.getFileIcon(document.fileName, document.contentType);
  }

  formatFileSize(bytes: number): string {
    return this.documentApiService.formatFileSize(bytes);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCategoryLabel(category?: string): string {
    if (!category) return '—';

    const labels: Record<string, string> = {
      'Contract': 'Contrat',
      'Invoice': 'Facture',
      'ID': 'Pièce d\'identité',
      'Photo': 'Photo',
      'Other': 'Autre'
    };

    return labels[category] || category;
  }

  getCategoryBadgeClass(category?: string): string {
    if (!category) return 'category-badge';

    const classes: Record<string, string> = {
      'Contract': 'category-badge category-contract',
      'Invoice': 'category-badge category-invoice',
      'ID': 'category-badge category-id',
      'Photo': 'category-badge category-photo',
      'Other': 'category-badge category-other'
    };

    return classes[category] || 'category-badge';
  }

  isPreviewable(document: DocumentResponse): boolean {
    return this.documentApiService.isPreviewable(document.contentType);
  }

  hasDocuments(): boolean {
    return this.documents.length > 0;
  }

  getAiStatusText(contentType: string | undefined): string | null {
    if (!contentType) return null;
    const match = contentType.match(/AI_STATUS:(VALIDE|INVALIDE)/);
    if (match && match.length > 1) {
      return match[1];
    }
    return null;
  }

  getAiStatusClass(contentType: string | undefined): string {
    const status = this.getAiStatusText(contentType);
    if (status === 'VALIDE') return 'ai-badge ai-valide';
    if (status === 'INVALIDE') return 'ai-badge ai-invalide';
    return 'ai-badge';
  }
}
