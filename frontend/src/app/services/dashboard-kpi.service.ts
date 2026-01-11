import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DossierResponse } from './dossier-api.service';

export interface KpiCardResponse {
  value: number;
  trend: string;
}

export interface TrendData {
  currentValue: number;
  previousValue: number;
  percentageChange: number;
}

export interface TrendsResponse {
  [key: string]: TrendData;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardKpiService {

  private readonly apiUrl = '/api/v1/dashboard';

  constructor(private http: HttpClient) { }

  getActiveAnnoncesCount(period?: string): Observable<KpiCardResponse> {
    const options = period ? { params: { period } } : {};
    return this.http.get<KpiCardResponse>(`${this.apiUrl}/kpis/annonces-actives`, options);
  }

  getDossiersATraiterCount(period?: string): Observable<KpiCardResponse> {
    const options = period ? { params: { period } } : {};
    return this.http.get<KpiCardResponse>(`${this.apiUrl}/kpis/dossiers-a-traiter`, options);
  }

  getTrends(period?: string): Observable<TrendsResponse> {
    const options = period ? { params: { period } } : {};
    return this.http.get<TrendsResponse>(`${this.apiUrl}/kpis/trends`, options);
  }

  getRecentDossiers(filter?: string): Observable<DossierResponse[]> {
    const options = filter ? { params: { filter } } : {};
    return this.http.get<DossierResponse[]>(`${this.apiUrl}/dossiers/recent`, options);
  }
}
