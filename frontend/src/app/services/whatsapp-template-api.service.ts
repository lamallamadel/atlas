import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WhatsAppTemplateResponse {
  id: number;
  orgId: string;
  name: string;
  language: string;
  category: string;
  status: string;
  whatsAppTemplateId?: string;
  components: any[];
  variables?: TemplateVariable[];
  description?: string;
  rejectionReason?: string;
  currentVersion: number;
  metaSubmissionId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface TemplateVariable {
  id: number;
  variableName: string;
  componentType: string;
  position: number;
  exampleValue?: string;
  description?: string;
  isRequired: boolean;
}

export interface WhatsAppTemplateRequest {
  name: string;
  language: string;
  category: string;
  components: any[];
  variables?: TemplateVariableRequest[];
  description?: string;
}

export interface TemplateVariableRequest {
  variableName: string;
  componentType: string;
  position: number;
  exampleValue?: string;
  description?: string;
  isRequired?: boolean;
}

export interface TemplateVersionResponse {
  id: number;
  templateId: number;
  versionNumber: number;
  components: any[];
  variablesSnapshot: any[];
  description?: string;
  changeSummary?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface TemplateVersionRequest {
  changeSummary: string;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsAppTemplateApiService {
  private apiUrl = `${environment.apiBaseUrl}/api/whatsapp/templates`;

  constructor(private http: HttpClient) { }

  getAllTemplates(status?: string): Observable<WhatsAppTemplateResponse[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<WhatsAppTemplateResponse[]>(this.apiUrl, { params });
  }

  getActiveTemplates(): Observable<WhatsAppTemplateResponse[]> {
    return this.http.get<WhatsAppTemplateResponse[]>(`${this.apiUrl}/active`);
  }

  getTemplateById(id: number): Observable<WhatsAppTemplateResponse> {
    return this.http.get<WhatsAppTemplateResponse>(`${this.apiUrl}/${id}`);
  }

  searchTemplates(filters: {
    category?: string;
    status?: string;
    language?: string;
    searchTerm?: string;
  }): Observable<WhatsAppTemplateResponse[]> {
    let params = new HttpParams();
    if (filters.category) params = params.set('category', filters.category);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.language) params = params.set('language', filters.language);
    if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);

    return this.http.get<WhatsAppTemplateResponse[]>(`${this.apiUrl}/search`, { params });
  }

  createTemplate(request: WhatsAppTemplateRequest): Observable<WhatsAppTemplateResponse> {
    return this.http.post<WhatsAppTemplateResponse>(this.apiUrl, request);
  }

  updateTemplate(id: number, request: WhatsAppTemplateRequest): Observable<WhatsAppTemplateResponse> {
    return this.http.put<WhatsAppTemplateResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  submitForApproval(id: number): Observable<WhatsAppTemplateResponse> {
    return this.http.post<WhatsAppTemplateResponse>(`${this.apiUrl}/${id}/submit-for-approval`, {});
  }

  pollApprovalStatus(id: number): Observable<WhatsAppTemplateResponse> {
    return this.http.post<WhatsAppTemplateResponse>(`${this.apiUrl}/${id}/poll-status`, {});
  }

  activateTemplate(id: number): Observable<WhatsAppTemplateResponse> {
    return this.http.post<WhatsAppTemplateResponse>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateTemplate(id: number): Observable<WhatsAppTemplateResponse> {
    return this.http.post<WhatsAppTemplateResponse>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  pauseTemplate(id: number): Observable<WhatsAppTemplateResponse> {
    return this.http.post<WhatsAppTemplateResponse>(`${this.apiUrl}/${id}/pause`, {});
  }

  createNewVersion(id: number, request: TemplateVersionRequest): Observable<WhatsAppTemplateResponse> {
    return this.http.post<WhatsAppTemplateResponse>(`${this.apiUrl}/${id}/versions`, request);
  }

  getTemplateVersions(id: number): Observable<TemplateVersionResponse[]> {
    return this.http.get<TemplateVersionResponse[]>(`${this.apiUrl}/${id}/versions`);
  }

  getTemplateVersion(id: number, versionNumber: number): Observable<TemplateVersionResponse> {
    return this.http.get<TemplateVersionResponse>(`${this.apiUrl}/${id}/versions/${versionNumber}`);
  }

  activateVersion(id: number, versionNumber: number): Observable<WhatsAppTemplateResponse> {
    return this.http.post<WhatsAppTemplateResponse>(`${this.apiUrl}/${id}/versions/${versionNumber}/activate`, {});
  }
}
