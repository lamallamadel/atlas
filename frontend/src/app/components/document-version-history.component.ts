import { Component, Input, OnInit } from '@angular/core';
import { DocumentWorkflowService } from '../services/document-workflow.service';
import { DocumentVersion } from '../models/document-workflow.model';

@Component({
  selector: 'app-document-version-history',
  template: `
    <div class="version-history">
      <h3>Version History</h3>
      <div class="versions-list">
        <div class="version-item" *ngFor="let version of versions">
          <div class="version-header">
            <span class="version-number">v{{version.versionNumber}}</span>
            <span class="version-badge" *ngIf="version.isCurrent">Current</span>
          </div>
          <div class="version-details">
            <p><strong>File:</strong> {{version.fileName}} ({{formatSize(version.fileSize)}})</p>
            <p><strong>Uploaded:</strong> {{version.createdAt | date:'short'}} by {{version.uploadedBy}}</p>
            <p *ngIf="version.versionNotes"><strong>Notes:</strong> {{version.versionNotes}}</p>
          </div>
          <div class="version-actions">
            <button (click)="compareWith(version)" [disabled]="!canCompare(version)">
              Compare
            </button>
            <button (click)="restore(version)" [disabled]="version.isCurrent">
              Restore
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .version-history { padding: 20px; }
    .versions-list { display: flex; flex-direction: column; gap: 15px; }
    .version-item { border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
    .version-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .version-number { font-weight: bold; font-size: 18px; }
    .version-badge { background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .version-details p { margin: 5px 0; }
    .version-actions { display: flex; gap: 10px; margin-top: 10px; }
    button { padding: 6px 12px; border: 1px solid #007bff; background: white; color: #007bff; border-radius: 4px; cursor: pointer; }
    button:hover:not(:disabled) { background: #007bff; color: white; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class DocumentVersionHistoryComponent implements OnInit {
  @Input() documentId!: number;
  versions: DocumentVersion[] = [];
  selectedVersion: DocumentVersion | null = null;

  constructor(private workflowService: DocumentWorkflowService) {}

  ngOnInit(): void {
    this.loadVersions();
  }

  loadVersions(): void {
    this.workflowService.getDocumentVersions(this.documentId).subscribe({
      next: (versions) => {
        this.versions = versions;
      },
      error: (error) => console.error('Error loading versions:', error)
    });
  }

  canCompare(version: DocumentVersion): boolean {
    return this.versions.length > 1 && !version.isCurrent;
  }

  compareWith(version: DocumentVersion): void {
    const currentVersion = this.versions.find(v => v.isCurrent);
    if (!currentVersion) return;

    this.workflowService.compareVersions(
      this.documentId,
      version.versionNumber,
      currentVersion.versionNumber
    ).subscribe({
      next: (comparison) => {
        alert(JSON.stringify(comparison, null, 2));
      },
      error: (error) => console.error('Error comparing versions:', error)
    });
  }

  restore(version: DocumentVersion): void {
    if (!confirm(`Restore version ${version.versionNumber}?`)) return;

    this.workflowService.restoreVersion(this.documentId, version.versionNumber).subscribe({
      next: () => this.loadVersions(),
      error: (error) => console.error('Error restoring version:', error)
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
