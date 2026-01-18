import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum MessageChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PHONE = 'PHONE',
  CHAT = 'CHAT',
  IN_APP = 'IN_APP'
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum MessageDeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ'
}

export interface MessageCreateRequest {
  dossierId: number;
  channel: MessageChannel;
  direction: MessageDirection;
  content: string;
  timestamp: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

export interface MessageResponse {
  id: number;
  orgId: string;
  dossierId: number;
  channel: MessageChannel;
  direction: MessageDirection;
  content: string;
  timestamp: string;
  createdAt: string;
  deliveryStatus?: MessageDeliveryStatus;
  templateId?: string;
  templateVariables?: Record<string, string>;
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

export interface MessageListParams {
  dossierId: number;
  channel?: MessageChannel;
  direction?: MessageDirection;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageApiService {

  private readonly apiUrl = '/api/v1/messages';

  constructor(private http: HttpClient) { }

  list(params: MessageListParams): Observable<Page<MessageResponse>> {
    let httpParams = new HttpParams().set('dossierId', params.dossierId.toString());

    if (params.channel !== undefined) {
      httpParams = httpParams.set('channel', params.channel);
    }
    if (params.direction !== undefined) {
      httpParams = httpParams.set('direction', params.direction);
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

    return this.http.get<Page<MessageResponse>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: MessageCreateRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.apiUrl, request);
  }

  retry(id: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/${id}/retry`, {});
  }
}
