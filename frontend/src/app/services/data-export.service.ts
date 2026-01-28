import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DataExportRequest {
  id: number;
  orgId: string;
  requestType: string;
  requesterEmail: string;
  requesterUserId: string;
  exportFormat: string;
  includeDocuments: boolean;
  includeAuditLogs: boolean;
  status: string;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  exportFilePath?: string;
  exportFileSizeBytes?: number;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
  downloadCount: number;
  maxDownloads: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataExportService {
  private baseUrl = '/api/v1/data-export';

  constructor(private http: HttpClient) {}

  requestExport(
    requestType: string = 'full',
    exportFormat: string = 'json',
    includeDocuments: boolean = true,
    includeAuditLogs: boolean = false
  ): Observable<DataExportRequest> {
    return this.http.post<DataExportRequest>(`${this.baseUrl}/request`, {
      requestType,
      exportFormat,
      includeDocuments,
      includeAuditLogs
    });
  }

  getExportRequests(): Observable<DataExportRequest[]> {
    return this.http.get<DataExportRequest[]>(`${this.baseUrl}/requests`);
  }

  getExportRequest(id: number): Observable<DataExportRequest> {
    return this.http.get<DataExportRequest>(`${this.baseUrl}/requests/${id}`);
  }

  downloadExport(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${id}`, { responseType: 'blob' });
  }

  initiateDownload(exportRequest: DataExportRequest): void {
    if (exportRequest.downloadUrl) {
      window.open(exportRequest.downloadUrl, '_blank');
    }
  }
}
