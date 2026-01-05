import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum ActivityType {
  NOTE = 'NOTE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  MESSAGE_SENT = 'MESSAGE_SENT'
}

export enum ActivityVisibility {
  INTERNAL = 'INTERNAL',
  CLIENT_VISIBLE = 'CLIENT_VISIBLE'
}

export interface ActivityResponse {
  id: number;
  type: ActivityType;
  content: string;
  dossierId: number;
  visibility: ActivityVisibility;
  createdAt: string;
  createdBy: string;
}

export interface ActivityCreateRequest {
  type: ActivityType;
  content: string;
  dossierId: number;
  visibility: ActivityVisibility;
}

export interface ActivityUpdateRequest {
  content?: string;
  visibility?: ActivityVisibility;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityApiService {
  private baseUrl = '/api/v1/activities';

  constructor(private http: HttpClient) {}

  create(request: ActivityCreateRequest): Observable<ActivityResponse> {
    return this.http.post<ActivityResponse>(this.baseUrl, request);
  }

  getById(id: number): Observable<ActivityResponse> {
    return this.http.get<ActivityResponse>(`${this.baseUrl}/${id}`);
  }

  list(params: {
    dossierId?: number;
    visibility?: ActivityVisibility;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<Page<ActivityResponse>> {
    let httpParams = new HttpParams();

    if (params.dossierId !== undefined) {
      httpParams = httpParams.set('dossierId', params.dossierId.toString());
    }
    if (params.visibility) {
      httpParams = httpParams.set('visibility', params.visibility);
    }
    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<Page<ActivityResponse>>(this.baseUrl, { params: httpParams });
  }

  update(id: number, request: ActivityUpdateRequest): Observable<ActivityResponse> {
    return this.http.put<ActivityResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
