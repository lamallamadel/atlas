import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum DossierStatus {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  APPOINTMENT = 'APPOINTMENT',
  WON = 'WON',
  LOST = 'LOST'
}

export interface DossierResponse {
  id: number;
  orgId: string;
  annonceId?: number;
  leadPhone?: string;
  leadName?: string;
  leadSource?: string;
  status: DossierStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface DossierCreateRequest {
  orgId: string;
  annonceId?: number;
  leadPhone?: string;
  leadName?: string;
  leadSource?: string;
}

export interface DossierStatusPatchRequest {
  status: DossierStatus;
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

  checkDuplicates(phone: string): Observable<DossierResponse[]> {
    const httpParams = new HttpParams().set('leadPhone', phone);
    return this.http.get<DossierResponse[]>(`${this.apiUrl}/check-duplicates`, { params: httpParams });
  }
}
