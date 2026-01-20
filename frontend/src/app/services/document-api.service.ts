import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentResponse {
  id: number;
  orgId: string;
  dossierId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadedBy: string;
  contentType: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export enum DocumentCategory {
  CONTRACT = 'Contract',
  INVOICE = 'Invoice',
  ID = 'ID',
  PHOTO = 'Photo',
  OTHER = 'Other'
}

@Injectable({
  providedIn: 'root'
})
export class DocumentApiService {
  private baseUrl = '/api/v1/documents';

  constructor(private http: HttpClient) {}

  upload(dossierId: number, file: File, category?: string): Observable<HttpEvent<DocumentResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dossierId', dossierId.toString());
    if (category) {
      formData.append('category', category);
    }

    const req = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
      reportProgress: true
    });

    return this.http.request<DocumentResponse>(req);
  }

  listByDossier(dossierId: number, page = 0, size = 20, sort = 'createdAt,desc'): Observable<Page<DocumentResponse>> {
    const params: any = { page: page.toString(), size: size.toString(), sort };
    return this.http.get<Page<DocumentResponse>>(`${this.baseUrl}/dossier/${dossierId}`, { params });
  }

  getById(documentId: number): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${this.baseUrl}/${documentId}`);
  }

  download(documentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${documentId}/download`, {
      responseType: 'blob'
    });
  }

  delete(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${documentId}`);
  }

  getFileIcon(fileName: string, contentType?: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (contentType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return 'image';
    }
    
    if (contentType === 'application/pdf' || extension === 'pdf') {
      return 'picture_as_pdf';
    }
    
    if (['doc', 'docx'].includes(extension || '') || contentType?.includes('word')) {
      return 'description';
    }
    
    if (['xls', 'xlsx'].includes(extension || '') || contentType?.includes('spreadsheet') || contentType?.includes('excel')) {
      return 'table_chart';
    }
    
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  isPreviewable(contentType: string): boolean {
    return contentType?.startsWith('image/') || contentType === 'application/pdf';
  }
}
