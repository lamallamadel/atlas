import { Component, Input, OnInit } from '@angular/core';
import { CustomerPortalDocument } from '../models/customer-portal.models';
import { CustomerPortalService } from '../services/customer-portal.service';

@Component({
  selector: 'app-client-document-library',
  template: `
    <div class="document-library">
      <h2>Vos documents</h2>
      
      <div *ngIf="!documents || documents.length === 0" class="empty-state">
        <p>Aucun document disponible</p>
      </div>

      <div class="document-grid">
        <div *ngFor="let doc of documents" class="document-card" (click)="downloadDocument(doc)">
          <div class="document-icon">
            <span *ngIf="isImage(doc)">🖼️</span>
            <span *ngIf="isPdf(doc)">📄</span>
            <span *ngIf="!isImage(doc) && !isPdf(doc)">📎</span>
          </div>
          <div class="document-info">
            <div class="document-name">{{ doc.fileName }}</div>
            <div class="document-meta">
              <span class="document-category">{{ doc.categoryDisplay }}</span>
              <span class="document-size">{{ formatFileSize(doc.fileSize) }}</span>
            </div>
            <div class="document-date">{{ doc.uploadedAt | date:'short' }}</div>
          </div>
          <div class="download-icon">⬇️</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .document-library {
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 24px 0;
      font-size: 20px;
      color: #333;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #999;
    }

    .document-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .document-card {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .document-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      transform: translateY(-2px);
    }

    .document-icon {
      font-size: 32px;
      margin-right: 12px;
    }

    .document-info {
      flex: 1;
    }

    .document-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .document-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
    }

    .document-category {
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .document-date {
      font-size: 12px;
      color: #999;
    }

    .download-icon {
      font-size: 20px;
      opacity: 0.5;
    }

    .document-card:hover .download-icon {
      opacity: 1;
    }
  `]
})
export class ClientDocumentLibraryComponent implements OnInit {
  @Input() documents: CustomerPortalDocument[] = [];

  constructor(private portalService: CustomerPortalService) {}

  ngOnInit(): void {}

  downloadDocument(doc: CustomerPortalDocument): void {
    this.portalService.downloadDocument(doc.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  isImage(doc: CustomerPortalDocument): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(doc.fileType?.toLowerCase() || '');
  }

  isPdf(doc: CustomerPortalDocument): boolean {
    return doc.fileType?.toLowerCase() === 'pdf';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
