import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum CommentEntityType {
  ANNONCE = 'ANNONCE',
  DOSSIER = 'DOSSIER',
  APPOINTMENT = 'APPOINTMENT'
}

export interface CommentThread {
  id: number;
  entityType: CommentEntityType;
  entityId: number;
  title?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Comment {
  id: number;
  threadId: number;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateThreadRequest {
  entityType: CommentEntityType;
  entityId: number;
  title?: string;
  initialComment?: string;
}

export interface CreateCommentRequest {
  threadId: number;
  content: string;
  mentions?: string[];
}

export interface CommentSearchResult {
  commentId: number;
  threadId: number;
  content: string;
  entityType: CommentEntityType;
  entityId: number;
  threadTitle?: string;
  createdAt: string;
  createdBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = '/api/comments';

  constructor(private http: HttpClient) {}

  createThread(request: CreateThreadRequest): Observable<CommentThread> {
    return this.http.post<CommentThread>(`${this.apiUrl}/threads`, request);
  }

  addComment(request: CreateCommentRequest): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, request);
  }

  getThreadsForEntity(entityType: CommentEntityType, entityId: number): Observable<CommentThread[]> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId.toString());
    return this.http.get<CommentThread[]>(`${this.apiUrl}/threads`, { params });
  }

  getThread(threadId: number): Observable<CommentThread> {
    return this.http.get<CommentThread>(`${this.apiUrl}/threads/${threadId}`);
  }

  resolveThread(threadId: number): Observable<CommentThread> {
    return this.http.post<CommentThread>(`${this.apiUrl}/threads/${threadId}/resolve`, {});
  }

  unresolveThread(threadId: number): Observable<CommentThread> {
    return this.http.post<CommentThread>(`${this.apiUrl}/threads/${threadId}/unresolve`, {});
  }

  deleteThread(threadId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/threads/${threadId}`);
  }

  searchComments(query: string): Observable<CommentSearchResult[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<CommentSearchResult[]>(`${this.apiUrl}/search`, { params });
  }

  countUnresolvedThreads(entityType: CommentEntityType, entityId: number): Observable<number> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId.toString());
    return this.http.get<number>(`${this.apiUrl}/count/unresolved`, { params });
  }

  getCommentsByUser(username: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/user/${username}`);
  }

  getCommentsByMention(username: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/mentions/${username}`);
  }

  exportThread(threadId: number, format: 'text' | 'csv' = 'text'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http.get(`${this.apiUrl}/export/threads/${threadId}`, {
      params,
      responseType: 'blob'
    });
  }

  exportAllThreadsForEntity(entityType: CommentEntityType, entityId: number): Observable<Blob> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId.toString());
    return this.http.get(`${this.apiUrl}/export/entity`, {
      params,
      responseType: 'blob'
    });
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
