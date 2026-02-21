import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SignatureRequest, 
  SignatureRequestCreate, 
  ContractTemplate, 
  ContractTemplateCreate 
} from '../models/esignature.models';

@Injectable({
  providedIn: 'root'
})
export class ESignatureApiService {
  private apiUrl = '/api/v1/esignature';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Org-Id': localStorage.getItem('orgId') || 'default',
      'X-User-Id': localStorage.getItem('userId') || 'user'
    });
  }

  createSignatureRequest(request: SignatureRequestCreate): Observable<SignatureRequest> {
    return this.http.post<SignatureRequest>(
      `${this.apiUrl}/signature-requests`,
      request,
      { headers: this.getHeaders() }
    );
  }

  sendSignatureRequest(id: number): Observable<SignatureRequest> {
    return this.http.post<SignatureRequest>(
      `${this.apiUrl}/signature-requests/${id}/send`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getSignatureRequestsByDossier(dossierId: number): Observable<SignatureRequest[]> {
    return this.http.get<SignatureRequest[]>(
      `${this.apiUrl}/signature-requests/dossier/${dossierId}`,
      { headers: this.getHeaders() }
    );
  }

  getSignatureRequest(id: number): Observable<SignatureRequest> {
    return this.http.get<SignatureRequest>(
      `${this.apiUrl}/signature-requests/${id}`,
      { headers: this.getHeaders() }
    );
  }

  uploadTemplate(file: File, template: ContractTemplateCreate): Observable<ContractTemplate> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('templateName', template.templateName);
    formData.append('templateType', template.templateType);
    
    if (template.description) {
      formData.append('description', template.description);
    }
    
    if (template.signatureFields) {
      formData.append('signatureFields', JSON.stringify(template.signatureFields));
    }

    return this.http.post<ContractTemplate>(
      `${this.apiUrl}/templates`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  getActiveTemplates(): Observable<ContractTemplate[]> {
    return this.http.get<ContractTemplate[]>(
      `${this.apiUrl}/templates`,
      { headers: this.getHeaders() }
    );
  }

  getTemplate(id: number): Observable<ContractTemplate> {
    return this.http.get<ContractTemplate>(
      `${this.apiUrl}/templates/${id}`,
      { headers: this.getHeaders() }
    );
  }

  updateTemplate(id: number, template: ContractTemplateCreate): Observable<ContractTemplate> {
    return this.http.put<ContractTemplate>(
      `${this.apiUrl}/templates/${id}`,
      template,
      { headers: this.getHeaders() }
    );
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/templates/${id}`,
      { headers: this.getHeaders() }
    );
  }
}
