import { Component, Input, OnInit } from '@angular/core';
import { DocumentWorkflowService } from '../services/document-workflow.service';
import { DocumentAudit, DocumentActionType } from '../models/document-workflow.model';

@Component({
  selector: 'app-document-audit-trail',
  template: `
    <div class="audit-trail">
      <h3>Audit Trail</h3>
      <div class="timeline">
        <div class="audit-entry" *ngFor="let audit of auditTrail">
          <div class="audit-icon" [ngClass]="getIconClass(audit.actionType)">
            <i [class]="getIcon(audit.actionType)"></i>
          </div>
          <div class="audit-content">
            <div class="audit-header">
              <strong>{{getActionLabel(audit.actionType)}}</strong>
              <span class="audit-time">{{audit.actionAt | date:'short'}}</span>
            </div>
            <p class="audit-description">{{audit.description}}</p>
            <p class="audit-user">By: {{audit.actionBy}}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .audit-trail { padding: 20px; }
    .timeline { position: relative; padding-left: 40px; }
    .timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e0e0e0; }
    .audit-entry { position: relative; margin-bottom: 20px; }
    .audit-icon { position: absolute; left: -28px; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: white; border: 2px solid #ddd; }
    .audit-icon.uploaded { border-color: #17a2b8; color: #17a2b8; }
    .audit-icon.approved { border-color: #28a745; color: #28a745; }
    .audit-icon.rejected { border-color: #dc3545; color: #dc3545; }
    .audit-icon.signed { border-color: #6f42c1; color: #6f42c1; }
    .audit-content { background: white; border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; }
    .audit-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .audit-time { color: #666; font-size: 12px; }
    .audit-description { margin: 5px 0; color: #333; }
    .audit-user { margin: 5px 0; color: #666; font-size: 13px; }
  `]
})
export class DocumentAuditTrailComponent implements OnInit {
  @Input() documentId!: number;
  auditTrail: DocumentAudit[] = [];

  constructor(private workflowService: DocumentWorkflowService) {}

  ngOnInit(): void {
    this.loadAuditTrail();
  }

  loadAuditTrail(): void {
    this.workflowService.getDocumentAuditTrail(this.documentId).subscribe({
      next: (trail) => {
        this.auditTrail = trail;
      },
      error: (error) => console.error('Error loading audit trail:', error)
    });
  }

  getActionLabel(action: DocumentActionType): string {
    return action.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  getIcon(action: DocumentActionType): string {
    const icons: Record<string, string> = {
      UPLOADED: 'fas fa-upload',
      VIEWED: 'fas fa-eye',
      DOWNLOADED: 'fas fa-download',
      REVIEWED: 'fas fa-search',
      APPROVED: 'fas fa-check',
      REJECTED: 'fas fa-times',
      SIGNED: 'fas fa-signature',
      ARCHIVED: 'fas fa-archive',
      DELETED: 'fas fa-trash',
      VERSION_CREATED: 'fas fa-code-branch',
      WORKFLOW_STARTED: 'fas fa-play',
      WORKFLOW_COMPLETED: 'fas fa-flag-checkered',
      WORKFLOW_CANCELLED: 'fas fa-ban',
      COMMENT_ADDED: 'fas fa-comment',
      SHARED: 'fas fa-share'
    };
    return icons[action] || 'fas fa-info-circle';
  }

  getIconClass(action: DocumentActionType): string {
    if (['APPROVED', 'WORKFLOW_COMPLETED'].includes(action)) return 'approved';
    if (['REJECTED', 'WORKFLOW_CANCELLED', 'DELETED'].includes(action)) return 'rejected';
    if (['SIGNED'].includes(action)) return 'signed';
    if (['UPLOADED', 'VERSION_CREATED'].includes(action)) return 'uploaded';
    return '';
  }
}
