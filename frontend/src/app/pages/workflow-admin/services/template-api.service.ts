import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WhatsAppTemplate, TemplateStatus, TemplateApprovalRequest, TemplateRejectionRequest, TemplateVariable } from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateApiService {
  private readonly apiUrl = '/api/whatsapp/templates';

  constructor(private http: HttpClient) {}

  getAllTemplates(status?: TemplateStatus): Observable<WhatsAppTemplate[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<WhatsAppTemplate[]>(this.apiUrl, { params });
  }

  getActiveTemplates(): Observable<WhatsAppTemplate[]> {
    return this.http.get<WhatsAppTemplate[]>(`${this.apiUrl}/active`);
  }

  getTemplateById(id: number): Observable<WhatsAppTemplate> {
    return this.http.get<WhatsAppTemplate>(`${this.apiUrl}/${id}`);
  }

  getTemplateByNameAndLanguage(name: string, language: string): Observable<WhatsAppTemplate> {
    const params = new HttpParams()
      .set('name', name)
      .set('language', language);
    return this.http.get<WhatsAppTemplate>(`${this.apiUrl}/by-name`, { params });
  }

  createTemplate(template: WhatsAppTemplate): Observable<WhatsAppTemplate> {
    return this.http.post<WhatsAppTemplate>(this.apiUrl, template);
  }

  updateTemplate(id: number, template: WhatsAppTemplate): Observable<WhatsAppTemplate> {
    return this.http.put<WhatsAppTemplate>(`${this.apiUrl}/${id}`, template);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activateTemplate(id: number): Observable<WhatsAppTemplate> {
    return this.http.post<WhatsAppTemplate>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateTemplate(id: number): Observable<WhatsAppTemplate> {
    return this.http.post<WhatsAppTemplate>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  submitForApproval(id: number): Observable<WhatsAppTemplate> {
    return this.http.post<WhatsAppTemplate>(`${this.apiUrl}/${id}/submit-for-approval`, {});
  }

  approveTemplate(id: number, request: TemplateApprovalRequest): Observable<WhatsAppTemplate> {
    return this.http.post<WhatsAppTemplate>(`${this.apiUrl}/${id}/approve`, request);
  }

  rejectTemplate(id: number, request: TemplateRejectionRequest): Observable<WhatsAppTemplate> {
    return this.http.post<WhatsAppTemplate>(`${this.apiUrl}/${id}/reject`, request);
  }

  getTemplateVariables(id: number): Observable<TemplateVariable[]> {
    return this.http.get<TemplateVariable[]>(`${this.apiUrl}/${id}/variables`);
  }
}
