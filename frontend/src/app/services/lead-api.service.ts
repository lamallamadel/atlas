import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LeadImportRequest {
  file: File;
  duplicateStrategy: 'SKIP' | 'OVERWRITE' | 'CREATE_NEW';
}

export interface LeadImportJobResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  errors: LeadImportError[];
}

export interface LeadImportError {
  rowNumber: number;
  leadName?: string;
  leadPhone?: string;
  reason: string;
}

export interface LeadExportRequest {
  columns: string[];
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeadApiService {
  private readonly apiUrl = '/api/v1/leads';

  constructor(private http: HttpClient) {}

  importLeads(file: File, duplicateStrategy: string): Observable<LeadImportJobResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicateStrategy', duplicateStrategy);

    return this.http.post<LeadImportJobResponse>(`${this.apiUrl}/import`, formData);
  }

  getImportStatus(jobId: string): Observable<LeadImportJobResponse> {
    return this.http.get<LeadImportJobResponse>(`${this.apiUrl}/import/${jobId}/status`);
  }

  exportLeads(request: LeadExportRequest): Observable<Blob> {
    let params = new HttpParams();
    
    request.columns.forEach(col => {
      params = params.append('columns', col);
    });
    
    if (request.status) {
      params = params.set('status', request.status);
    }
    if (request.dateFrom) {
      params = params.set('dateFrom', request.dateFrom);
    }
    if (request.dateTo) {
      params = params.set('dateTo', request.dateTo);
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
