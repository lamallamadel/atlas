import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface NotificationResponse {
  id: number;
  orgId: string;
  dossierId?: number;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  status: 'PENDING' | 'SENT' | 'FAILED';
  templateId: string;
  variables?: { [key: string]: any };
  recipient: string;
  subject?: string;
  message?: string;
  actionUrl?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPage {
  content: NotificationResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private apiUrl = `${environment.apiBaseUrl}/v1/notifications`;
  private pollingInterval = 30000;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  private startPolling(): void {
    timer(0, this.pollingInterval)
      .pipe(
        switchMap(() => this.fetchUnreadCount())
      )
      .subscribe({
        next: (count) => this.unreadCountSubject.next(count),
        error: (err) => console.error('Error polling unread count:', err)
      });
  }

  private fetchUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  list(
    dossierId?: number,
    type?: string,
    status?: string,
    page = 0,
    size = 20,
    sort = 'createdAt,desc'
  ): Observable<NotificationPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (dossierId) {
      params = params.set('dossierId', dossierId.toString());
    }
    if (type) {
      params = params.set('type', type);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<NotificationPage>(this.apiUrl, { params });
  }

  getById(id: number): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.apiUrl}/${id}`);
  }

  markAsRead(id: number): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const currentCount = this.unreadCountSubject.value;
        if (currentCount > 0) {
          this.unreadCountSubject.next(currentCount - 1);
        }
      })
    );
  }

  markAsUnread(id: number): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.apiUrl}/${id}/unread`, {}).pipe(
      tap(() => {
        const currentCount = this.unreadCountSubject.value;
        this.unreadCountSubject.next(currentCount + 1);
      })
    );
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  refreshUnreadCount(): void {
    this.fetchUnreadCount().subscribe({
      next: (count) => this.unreadCountSubject.next(count),
      error: (err) => console.error('Error refreshing unread count:', err)
    });
  }
}
