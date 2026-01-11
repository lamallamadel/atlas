import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export enum DossierSource {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  REFERRAL = 'REFERRAL',
  WALK_IN = 'WALK_IN',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA'
}

export enum DossierStatus {
  NEW = 'NEW',
  QUALIFYING = 'QUALIFYING',
  QUALIFIED = 'QUALIFIED',
  APPOINTMENT = 'APPOINTMENT',
  WON = 'WON',
  LOST = 'LOST'
}

export enum PartiePrenanteRole {
  LEAD = 'LEAD',
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  AGENT = 'AGENT',
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  NOTARY = 'NOTARY',
  BANK = 'BANK',
  ATTORNEY = 'ATTORNEY'
}

export interface PartiePrenanteResponse {
  id: number;
  dossierId: number;
  role: PartiePrenanteRole;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  meta?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DossierResponse {
  id: number;
  orgId: string;
  annonceId?: number;
  annonceTitle?: string;
  leadPhone?: string;
  leadName?: string;
  leadSource?: string;
  status: DossierStatus;
  score?: number;
  source?: DossierSource;
  parties?: PartiePrenanteResponse[];
  existingOpenDossierId?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface DossierCreateRequest {
  annonceId?: number;
  leadPhone?: string;
  leadName?: string;
  leadSource?: string;
}

export interface DossierStatusPatchRequest {
  status: DossierStatus;
}

export interface DossierLeadPatchRequest {
  leadName: string;
  leadPhone: string;
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

export interface DossierListParams {
  status?: DossierStatus;
  leadPhone?: string;
  annonceId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export interface DossierBulkAssignRequest {
  ids: number[];
  status: DossierStatus;
  reason?: string;
  userId?: string;
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
export class DossierApiService {

  private readonly apiUrl = '/api/v1/dossiers';

  constructor(private http: HttpClient) { }

  list(params: DossierListParams = {}): Observable<Page<DossierResponse>> {
    let httpParams = new HttpParams();

    if (params.status !== undefined) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.leadPhone !== undefined) {
      httpParams = httpParams.set('leadPhone', params.leadPhone);
    }
    if (params.annonceId !== undefined) {
      httpParams = httpParams.set('annonceId', params.annonceId.toString());
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

    return this.http.get<Page<DossierResponse>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<DossierResponse> {
    return this.http.get<DossierResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: DossierCreateRequest): Observable<DossierResponse> {
    return this.http.post<DossierResponse>(this.apiUrl, request);
  }

  patchStatus(id: number, status: DossierStatus): Observable<DossierResponse> {
    const request: DossierStatusPatchRequest = { status };
    return this.http.patch<DossierResponse>(`${this.apiUrl}/${id}/status`, request);
  }

  patchLead(id: number, leadName: string, leadPhone: string): Observable<DossierResponse> {
    const request: DossierLeadPatchRequest = { leadName, leadPhone };
    return this.http.patch<DossierResponse>(`${this.apiUrl}/${id}/lead`, request);
  }

  checkDuplicates(phone: string): Observable<DossierResponse[]> {
    const params = new HttpParams().set('leadPhone', phone);

    return this.http
      .get<DossierResponse[]>(`${this.apiUrl}/check-duplicates`, {
        params,
        observe: 'response'
      })
      .pipe(
        map((res: HttpResponse<DossierResponse[]>) => {
          // 204 => body = null => []
          return res.body ?? [];
        })
      );
  }

  bulkAssign(request: DossierBulkAssignRequest): Observable<BulkOperationResponse> {
    return this.http.post<BulkOperationResponse>(`${this.apiUrl}/bulk-assign`, request);
  }

  getPendingCount(): Observable<number> {
    return this.list({ status: DossierStatus.NEW, size: 0 }).pipe(
      map(page => page.totalElements)
    );
  }
}
