import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum ConsentementChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
  POSTAL_MAIL = 'POSTAL_MAIL',
  IN_PERSON = 'IN_PERSON'
}

export enum ConsentementStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  PENDING = 'PENDING',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED'
}

export interface ConsentementCreateRequest {
  dossierId: number;
  channel: ConsentementChannel;
  status: ConsentementStatus;
  meta?: Record<string, any>;
}

export interface ConsentementUpdateRequest {
  channel: ConsentementChannel;
  status: ConsentementStatus;
  meta?: Record<string, any>;
}

export interface ConsentementResponse {
  id: number;
  orgId: string;
  dossierId: number;
  channel: ConsentementChannel;
  status: ConsentementStatus;
  meta?: Record<string, any>;
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

export interface ConsentementListParams {
  dossierId?: number;
  channel?: ConsentementChannel;
  status?: ConsentementStatus;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsentementApiService {

  private readonly apiUrl = '/api/v1/consentements';

  constructor(private http: HttpClient) { }

  list(params: ConsentementListParams = {}): Observable<Page<ConsentementResponse>> {
    let httpParams = new HttpParams();

    if (params.dossierId !== undefined) {
      httpParams = httpParams.set('dossierId', params.dossierId.toString());
    }
    if (params.channel !== undefined) {
      httpParams = httpParams.set('channel', params.channel);
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

    return this.http.get<Page<ConsentementResponse>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<ConsentementResponse> {
    return this.http.get<ConsentementResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: ConsentementCreateRequest): Observable<ConsentementResponse> {
    return this.http.post<ConsentementResponse>(this.apiUrl, request);
  }

  update(id: number, request: ConsentementUpdateRequest): Observable<ConsentementResponse> {
    return this.http.put<ConsentementResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
