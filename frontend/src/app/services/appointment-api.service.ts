import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface AppointmentCreateRequest {
  dossierId: number;
  startTime: string;
  endTime: string;
  location?: string;
  assignedTo?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface AppointmentUpdateRequest {
  startTime: string;
  endTime: string;
  location?: string;
  assignedTo?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface AppointmentResponse {
  id: number;
  orgId: string;
  dossierId: number;
  startTime: string;
  endTime: string;
  location?: string;
  assignedTo?: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  warnings?: string[];
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

export interface AppointmentListParams {
  dossierId?: number;
  status?: AppointmentStatus;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentApiService {

  private readonly apiUrl = '/api/v1/appointments';

  constructor(private http: HttpClient) { }

  list(params: AppointmentListParams = {}): Observable<Page<AppointmentResponse>> {
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

    return this.http.get<Page<AppointmentResponse>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: AppointmentCreateRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.apiUrl, request);
  }

  update(id: number, request: AppointmentUpdateRequest): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
