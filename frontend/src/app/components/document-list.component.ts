import { Component, OnInit, input, inject } from '@angular/core';
import { DocumentApiService, DocumentResponse } from '../services/document-api.service';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { DocumentPreviewDialogComponent } from './document-preview-dialog.component';
import { DocumentUploadComponent } from './document-upload.component';
import { LoadingSkeletonComponent } from './loading-skeleton.component';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsBadgeComponent,
  DsCardComponent,
  DsToastService,
  DsDialogService
} from '../design-system';

@Component({
    selector: 'app-document-list',
    standalone: true,
    templateUrl: './document-list.component.html',
    styleUrls: ['./document-list.component.css'],
    imports: [
      CommonModule,
      DocumentUploadComponent, 
      LoadingSkeletonComponent, 
      DsButtonComponent, 
      DsIconComponent,
      DsBadgeComponent,
      DsCardComponent
    ]
})
export class DocumentListComponent implements OnInit {
  private documentApiService = inject(DocumentApiService);
  private dsDialogService = inject(DsDialogService);
  private toastService = inject(DsToastService);

  readonly dossierId = input.required<number>();

  readonly documentAiAnalysisHint =
    'Analyse sémantique du texte extrait (OCR) de votre document via notre microservice d\'Intelligence Artificielle (document-service)';

  documents: DocumentResponse[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    const dossierId = this.dossierId();
    if (!dossierId) return;

    this.loading = true;
    this.error = null;

    this.documentApiService.listByDossier(dossierId, 0, 100)
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
      this.dsDialogService.open(DocumentPreviewDialogComponent, {
        width: '90vw',
        maxWidth: '1200px',
        data: { document }
      });
    } else {
      this.toastService.warning('Aperçu non disponible pour ce type de fichier');
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
          this.toastService.success('Téléchargement démarré');
        },
        error: (err) => {
          this.toastService.error('Échec du téléchargement');
          console.error('Error downloading document:', err);
        }
      });
  }

  deleteDocument(document: DocumentResponse): void {
    const dialogRef = this.dsDialogService.open<boolean>(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le document',
        message: `Êtes-vous sûr de vouloir supprimer "${document.fileName}" ? Cette action est irréversible.`
      }
    });

    dialogRef.closed.subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        this.documentApiService.delete(document.id)
          .subscribe({
            next: () => {
              this.documents = this.documents.filter(d => d.id !== document.id);
              this.toastService.success('Document supprimé avec succès');
            },
            error: (err) => {
              this.toastService.error('Échec de la suppression');
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

  getCategoryBadgeStatus(category?: string): any {
    if (!category) return 'neutral';
    const map: Record<string, any> = {
      'Contract': 'active',
      'Invoice': 'warning',
      'ID': 'info',
      'Photo': 'success',
      'Other': 'neutral'
    };
    return map[category] || 'neutral';
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

  getAiStatusBadgeStatus(contentType: string | undefined): any {
    const status = this.getAiStatusText(contentType);
    if (status === 'VALIDE') return 'success';
    if (status === 'INVALIDE') return 'error';
    return 'neutral';
  }
}
