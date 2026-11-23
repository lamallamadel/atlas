import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Cycle de vie d'une annonce : DRAFT → PUBLISHED ⇄ SUSPENDED → ARCHIVED.
 * ACTIVE et PAUSED sont les anciens noms de PUBLISHED et SUSPENDED : le serveur les accepte
 * encore en entrée mais ne les renvoie plus.
 */
export enum AnnonceStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
  /** @deprecated ancien nom de PUBLISHED */
  ACTIVE = 'ACTIVE',
  /** @deprecated ancien nom de SUSPENDED */
  PAUSED = 'PAUSED'
}

export type AnnonceTransitionCode = 'ANN_T_PUBLISH' | 'ANN_T_SUSPEND' | 'ANN_T_ARCHIVE';

export type AnnonceSuspendReason =
  'OWNER_PAUSE' | 'MOD_SUSPECT_FRAUD' | 'MOD_ILLEGAL_CONTENT' | 'MOD_DUPLICATE_LISTING' | 'MOD_OTHER';

export interface AnnonceTransitionOption {
  code: AnnonceTransitionCode;
  label: string;
  targetStatus: AnnonceStatus;
  requiresReason: boolean;
  allowed: boolean;
  blockers: { code: string; message: string }[];
}

/** GET /api/v1/annonces/{id}/publication */
export interface AnnoncePublication {
  annonceId: number;
  status: AnnonceStatus;
  quality: {
    score: number;
    photoCount: number;
    minPhotos: number;
    missing: { code: string; label: string; blocking: boolean }[];
  };
  trust: {
    duplicateStatut?: string | null;
    duplicateOfId?: number | null;
    duplicateSimilarity?: number | null;
    fraudStatut?: string | null;
    fraudScore?: number | null;
    blocking: boolean;
    override?: { reason: string; by?: string; at?: string } | null;
  };
  transitions: AnnonceTransitionOption[];
  suspension?: { reasonCode: AnnonceSuspendReason; comment?: string; by?: string; at?: string } | null;
  /** Signalements de visiteurs encore à traiter. */
  openReports: number;
}

export interface AnnonceResponse {
  id: number;
  orgId: string;
  title: string;
  description?: string;
  category?: string; // APARTMENT/HOUSE/STUDIO/COMMERCIAL
  type?: string;     // SALE/RENT/LEASE/EXCHANGE
  address?: string;
  surface?: number;
  city?: string;
  price?: number;
  currency?: string;
  status: AnnonceStatus;
  photos?: string[];
  rulesJson?: any;
  meta?: any;
  aiScore?: number;
  aiScoreDetails?: string;
  fraudScore?: number;
  fraudStatut?: string;          // SAIN | SUSPECT | FRAUDULEUX
  fraudAlertes?: string[];
  duplicateOfId?: number;
  duplicateSimilarity?: number;  // en %
  duplicateStatut?: string;      // DOUBLON_PROBABLE | DOUBLON_CERTAIN
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface AnnonceCreateRequest {
  title: string;
  description?: string;
  category?: string;
  type?: string;
  address?: string;
  surface?: number;
  city?: string;
  price?: number;
  currency?: string;
  photos?: string[];
  rulesJson?: any;
  meta?: any;
}

export interface AnnonceUpdateRequest {
  title?: string;
  description?: string;
  category?: string;
  type?: string;
  address?: string;
  surface?: number;
  city?: string;
  price?: number;
  currency?: string;
  status?: AnnonceStatus;
  photos?: string[];
  rulesJson?: any;
  meta?: any;
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

export interface AnnonceListParams {
  status?: AnnonceStatus;
  q?: string;
  city?: string;
  type?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AnnonceBulkUpdateRequest {
  ids: number[];
  updates: {
    status?: AnnonceStatus;
    city?: string;
  };
}

export interface BulkOperationResponse {
  successCount: number;
  failureCount: number;
  errors: BulkOperationError[];
}

export interface BulkOperationError {
  id: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnnonceApiService {
  private readonly apiUrl = '/api/v1/annonces';

  constructor(private http: HttpClient) { }

  list(params: AnnonceListParams = {}): Observable<Page<AnnonceResponse>> {
    let httpParams = new HttpParams();

    if (params.status !== undefined) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.q !== undefined) {
      httpParams = httpParams.set('q', params.q);
    }
    if (params.city !== undefined) {
      httpParams = httpParams.set('city', params.city);
    }
    if (params.type !== undefined) {
      httpParams = httpParams.set('type', params.type);
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

    return this.http.get<Page<AnnonceResponse>>(this.apiUrl, { params: httpParams });
  }

  getDistinctCities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/cities`);
  }

  getById(id: number): Observable<AnnonceResponse> {
    return this.http.get<AnnonceResponse>(`${this.apiUrl}/${id}`);
  }
  getPublication(id: number): Observable<AnnoncePublication> {
    return this.http.get<AnnoncePublication>(`${this.apiUrl}/${id}/publication`);
  }

  applyTransition(
    id: number,
    transitionCode: AnnonceTransitionCode,
    reasonCode?: AnnonceSuspendReason | null,
    comment?: string | null
  ): Observable<AnnonceResponse> {
    return this.http.post<AnnonceResponse>(`${this.apiUrl}/${id}/transitions`, {
      transitionCode, reasonCode: reasonCode ?? null, comment: comment ?? null
    });
  }

  overrideTrust(id: number, reason: string): Observable<AnnoncePublication> {
    return this.http.post<AnnoncePublication>(`${this.apiUrl}/${id}/trust/override`, { reason });
  }


  create(request: AnnonceCreateRequest): Observable<AnnonceResponse> {
    return this.http.post<AnnonceResponse>(this.apiUrl, request);
  }

  update(id: number, request: AnnonceUpdateRequest): Observable<AnnonceResponse> {
    return this.http.put<AnnonceResponse>(`${this.apiUrl}/${id}`, request);
  }

  bulkUpdate(request: AnnonceBulkUpdateRequest): Observable<BulkOperationResponse> {
    return this.http.post<BulkOperationResponse>(`${this.apiUrl}/bulk-update`, request);
  }
}
