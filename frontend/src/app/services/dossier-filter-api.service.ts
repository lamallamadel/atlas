import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DossierResponse, Page } from './dossier-api.service';

export interface FilterCondition {
  field: string;
  operator: string;
  value: any;
}

export interface DossierFilterRequest {
  conditions: FilterCondition[];
  logicOperator: 'AND' | 'OR';
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DossierFilterApiService {
  private readonly apiUrl = '/api/v1/dossiers';

  constructor(private http: HttpClient) {}

  advancedFilter(filterRequest: DossierFilterRequest): Observable<Page<DossierResponse>> {
    return this.http.post<Page<DossierResponse>>(
      `${this.apiUrl}/advanced-filter`,
      filterRequest
    );
  }

  countAdvancedFilter(filterRequest: DossierFilterRequest): Observable<number> {
    return this.http.post<number>(
      `${this.apiUrl}/advanced-filter/count`,
      filterRequest
    );
  }
}
