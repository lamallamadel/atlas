import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum OutboundMessageStatus {
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

export interface OutboundMessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  channel: string;
}

export interface OutboundMessageCreateRequest {
  dossierId: number;
  recipientPhone: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  content: string;
  channel: string;
}

export interface OutboundMessageResponse {
  id: number;
  orgId: string;
  dossierId: number;
  recipientPhone: string;
  content: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  status: OutboundMessageStatus;
  channel: string;
  attemptCount: number;
  lastAttemptAt?: string;
  sentAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface OutboundMessageListParams {
  dossierId?: number;
  status?: OutboundMessageStatus;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OutboundMessageApiService {

  private readonly apiUrl = '/api/v1/outbound-messages';

  constructor(private http: HttpClient) { }

  list(params: OutboundMessageListParams = {}): Observable<Page<OutboundMessageResponse>> {
    let httpParams = new HttpParams();

    if (params.dossierId !== undefined) {
      httpParams = httpParams.set('dossierId', params.dossierId.toString());
    }
    if (params.status !== undefined) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params.sort !== undefined) {
      httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<Page<OutboundMessageResponse>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<OutboundMessageResponse> {
    return this.http.get<OutboundMessageResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: OutboundMessageCreateRequest): Observable<OutboundMessageResponse> {
    return this.http.post<OutboundMessageResponse>(this.apiUrl, request);
  }

  retry(id: number): Observable<OutboundMessageResponse> {
    return this.http.post<OutboundMessageResponse>(`${this.apiUrl}/${id}/retry`, {});
  }

  listTemplates(): Observable<OutboundMessageTemplate[]> {
    return this.http.get<OutboundMessageTemplate[]>(`${this.apiUrl}/templates`);
  }
}
