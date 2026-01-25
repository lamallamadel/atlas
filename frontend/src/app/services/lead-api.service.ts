import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LeadImportRequest {
  file: File;
  duplicateStrategy: 'SKIP' | 'OVERWRITE' | 'CREATE_NEW';
}

export interface LeadImportError {
  row: number;
  field: string;
  message: string;
}

export interface LeadImportResponse {
  importJobId: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  validationErrors: LeadImportError[];
}

export interface ImportJobResponse {
  id: number;
  filename: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errorReport: string;
  createdAt: string;
  createdBy: string;
}

export interface LeadExportRequest {
  columns: string[];
  status?: string;
  startDate?: string;
  endDate?: string;
  source?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeadApiService {
  private readonly apiUrl = '/api/v1/leads';

  constructor(private http: HttpClient) {}

  importLeads(file: File, duplicateStrategy: string): Observable<LeadImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mergeStrategy', duplicateStrategy);

    return this.http.post<LeadImportResponse>(`${this.apiUrl}/import`, formData);
  }

  getImportHistory(): Observable<ImportJobResponse[]> {
    return this.http.get<ImportJobResponse[]>(`${this.apiUrl}/import/history`);
  }

  getImportJobById(id: number): Observable<ImportJobResponse> {
    return this.http.get<ImportJobResponse>(`${this.apiUrl}/import/history/${id}`);
  }

  exportLeads(request: LeadExportRequest): Observable<Blob> {
    let params = new HttpParams();
    
    if (request.columns && request.columns.length > 0) {
      params = params.set('columns', request.columns.join(','));
    }
    
    if (request.status) {
      params = params.set('status', request.status);
    }
    if (request.startDate) {
      params = params.set('startDate', request.startDate);
    }
    if (request.endDate) {
      params = params.set('endDate', request.endDate);
    }
    if (request.source) {
      params = params.set('source', request.source);
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((response: HttpResponse<Blob>) => response.body as Blob)
    );
  }
}
