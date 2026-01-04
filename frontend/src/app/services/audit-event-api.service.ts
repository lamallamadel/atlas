import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum AuditAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  VIEWED = 'VIEWED',
  EXPORTED = 'EXPORTED',
  IMPORTED = 'IMPORTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
  RESTORED = 'RESTORED'
}

export enum AuditEntityType {
  ANNONCE = 'ANNONCE',
  DOSSIER = 'DOSSIER',
  PARTIE_PRENANTE = 'PARTIE_PRENANTE',
  CONSENTEMENT = 'CONSENTEMENT',
  MESSAGE = 'MESSAGE',
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION'
}

export interface AuditEventCreateRequest {
  entityType: AuditEntityType;
  entityId: number;
  action: AuditAction;
  userId?: string;
  diff?: Record<string, any>;
}

export interface AuditEventResponse {
  id: number;
  orgId: string;
  entityType: AuditEntityType;
  entityId: number;
  action: AuditAction;
  userId?: string;
  diff?: Record<string, any>;
  createdAt: string;
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

export interface AuditEventListParams {
  entityType?: AuditEntityType;
  entityId?: number;
  action?: AuditAction;
  userId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditEventApiService {

  private readonly apiUrl = '/api/v1/audit-events';

  constructor(private http: HttpClient) { }

  list(params: AuditEventListParams = {}): Observable<Page<AuditEventResponse>> {
    let httpParams = new HttpParams();

    if (params.entityType !== undefined) {
      httpParams = httpParams.set('entityType', params.entityType);
    }
    if (params.entityId !== undefined) {
      httpParams = httpParams.set('entityId', params.entityId.toString());
    }
    if (params.action !== undefined) {
      httpParams = httpParams.set('action', params.action);
    }
    if (params.userId !== undefined) {
      httpParams = httpParams.set('userId', params.userId);
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

    return this.http.get<Page<AuditEventResponse>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<AuditEventResponse> {
    return this.http.get<AuditEventResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: AuditEventCreateRequest): Observable<AuditEventResponse> {
    return this.http.post<AuditEventResponse>(this.apiUrl, request);
  }

  listByDossier(dossierId: number, params: Partial<AuditEventListParams> = {}): Observable<Page<AuditEventResponse>> {
    return this.list({
      ...params,
      entityType: params.entityType,
      entityId: dossierId
    });
  }
}
