import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DocumentWorkflow,
  WorkflowApproval,
  DocumentAudit,
  DocumentVersion,
  WorkflowTemplate,
  CreateWorkflowRequest,
  ApprovalDecisionRequest,
  BulkApprovalRequest
} from '../models/document-workflow.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentWorkflowService {
  private baseUrl = '/api/document-workflows';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Org-Id': 'default-org',
      'X-User-Id': 'current-user'
    });
  }

  createWorkflow(request: CreateWorkflowRequest): Observable<DocumentWorkflow> {
    return this.http.post<DocumentWorkflow>(this.baseUrl, request, {
      headers: this.getHeaders()
    });
  }

  startWorkflow(workflowId: number): Observable<DocumentWorkflow> {
    return this.http.post<DocumentWorkflow>(
      `${this.baseUrl}/${workflowId}/start`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getWorkflow(workflowId: number): Observable<DocumentWorkflow> {
    return this.http.get<DocumentWorkflow>(`${this.baseUrl}/${workflowId}`, {
      headers: this.getHeaders()
    });
  }

  getWorkflowsByDocument(documentId: number): Observable<DocumentWorkflow[]> {
    return this.http.get<DocumentWorkflow[]>(
      `${this.baseUrl}/document/${documentId}`,
      { headers: this.getHeaders() }
    );
  }

  submitApproval(
    approvalId: number,
    request: ApprovalDecisionRequest
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/approvals/${approvalId}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  bulkApprove(request: BulkApprovalRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/approvals/bulk`, request, {
      headers: this.getHeaders()
    });
  }

  getPendingApprovals(): Observable<WorkflowApproval[]> {
    return this.http.get<WorkflowApproval[]>(
      `${this.baseUrl}/approvals/pending`,
      { headers: this.getHeaders() }
    );
  }

  getDocumentAuditTrail(documentId: number): Observable<DocumentAudit[]> {
    return this.http.get<DocumentAudit[]>(
      `${this.baseUrl}/documents/${documentId}/audit`,
      { headers: this.getHeaders() }
    );
  }

  createVersion(
    documentId: number,
    file: File,
    versionNotes?: string
  ): Observable<DocumentVersion> {
    const formData = new FormData();
    formData.append('file', file);
    if (versionNotes) {
      formData.append('versionNotes', versionNotes);
    }

    return this.http.post<DocumentVersion>(
      `${this.baseUrl}/documents/${documentId}/versions`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  getDocumentVersions(documentId: number): Observable<DocumentVersion[]> {
    return this.http.get<DocumentVersion[]>(
      `${this.baseUrl}/documents/${documentId}/versions`,
      { headers: this.getHeaders() }
    );
  }

  getCurrentVersion(documentId: number): Observable<DocumentVersion> {
    return this.http.get<DocumentVersion>(
      `${this.baseUrl}/documents/${documentId}/versions/current`,
      { headers: this.getHeaders() }
    );
  }

  restoreVersion(documentId: number, versionNumber: number): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/documents/${documentId}/versions/${versionNumber}/restore`,
      {},
      { headers: this.getHeaders() }
    );
  }

  compareVersions(
    documentId: number,
    fromVersion: number,
    toVersion: number
  ): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/documents/versions/compare`,
      { documentId, fromVersion, toVersion },
      { headers: this.getHeaders() }
    );
  }

  getAllTemplates(): Observable<WorkflowTemplate[]> {
    return this.http.get<WorkflowTemplate[]>(`${this.baseUrl}/templates`, {
      headers: this.getHeaders()
    });
  }

  getPopularTemplates(): Observable<WorkflowTemplate[]> {
    return this.http.get<WorkflowTemplate[]>(
      `${this.baseUrl}/templates/popular`,
      { headers: this.getHeaders() }
    );
  }

  getTemplate(templateId: number): Observable<WorkflowTemplate> {
    return this.http.get<WorkflowTemplate>(
      `${this.baseUrl}/templates/${templateId}`,
      { headers: this.getHeaders() }
    );
  }

  createTemplate(template: Partial<WorkflowTemplate>): Observable<WorkflowTemplate> {
    return this.http.post<WorkflowTemplate>(
      `${this.baseUrl}/templates`,
      template,
      { headers: this.getHeaders() }
    );
  }

  updateTemplate(
    templateId: number,
    template: Partial<WorkflowTemplate>
  ): Observable<WorkflowTemplate> {
    return this.http.put<WorkflowTemplate>(
      `${this.baseUrl}/templates/${templateId}`,
      template,
      { headers: this.getHeaders() }
    );
  }

  deleteTemplate(templateId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/templates/${templateId}`, {
      headers: this.getHeaders()
    });
  }
}
