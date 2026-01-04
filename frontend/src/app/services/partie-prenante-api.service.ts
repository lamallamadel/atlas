import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum PartiePrenanteRole {
  OWNER = 'OWNER',
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  AGENT = 'AGENT',
  NOTARY = 'NOTARY',
  BANK = 'BANK',
  ATTORNEY = 'ATTORNEY'
}

export interface PartiePrenanteCreateRequest {
  dossierId: number;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  meta?: Record<string, any>;
}

export interface PartiePrenanteUpdateRequest {
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  meta?: Record<string, any>;
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
  meta?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartiePrenanteApiService {

  private readonly apiUrl = '/api/v1/parties-prenantes';

  constructor(private http: HttpClient) { }

  list(dossierId: number): Observable<PartiePrenanteResponse[]> {
    const params = new HttpParams().set('dossierId', dossierId.toString());
    return this.http.get<PartiePrenanteResponse[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<PartiePrenanteResponse> {
    return this.http.get<PartiePrenanteResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: PartiePrenanteCreateRequest): Observable<PartiePrenanteResponse> {
    return this.http.post<PartiePrenanteResponse>(this.apiUrl, request);
  }

  update(id: number, request: PartiePrenanteUpdateRequest): Observable<PartiePrenanteResponse> {
    return this.http.put<PartiePrenanteResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
