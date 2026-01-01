import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum AnnonceStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface AnnonceResponse {
  id: number;
  orgId: string;
  title: string;
  description?: string;
  category?: string;
  city?: string;
  price?: number;
  currency?: string;
  status: AnnonceStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface AnnonceCreateRequest {
  orgId: string;
  title: string;
  description?: string;
  category?: string;
  city?: string;
  price?: number;
  currency?: string;
}

export interface AnnonceUpdateRequest {
  title?: string;
  description?: string;
  category?: string;
  city?: string;
  price?: number;
  currency?: string;
  status?: AnnonceStatus;
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
  page?: number;
  size?: number;
  sort?: string;
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

  getById(id: number): Observable<AnnonceResponse> {
    return this.http.get<AnnonceResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: AnnonceCreateRequest): Observable<AnnonceResponse> {
    return this.http.post<AnnonceResponse>(this.apiUrl, request);
  }

  update(id: number, request: AnnonceUpdateRequest): Observable<AnnonceResponse> {
    return this.http.put<AnnonceResponse>(`${this.apiUrl}/${id}`, request);
  }
}
