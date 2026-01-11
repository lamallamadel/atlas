import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DossierResponse } from './dossier-api.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardKpiService {

  private readonly apiUrl = '/api/v1/dashboard';

  constructor(private http: HttpClient) { }

  getActiveAnnoncesCount(period?: string): Observable<number> {
    const options = period ? { params: { period } } : {};
    return this.http.get<number>(`${this.apiUrl}/kpis/annonces-actives`, options);
  }

  getDossiersATraiterCount(period?: string): Observable<number> {
    const options = period ? { params: { period } } : {};
    return this.http.get<number>(`${this.apiUrl}/kpis/dossiers-a-traiter`, options);
  }

  getRecentDossiers(): Observable<DossierResponse[]> {
    return this.http.get<DossierResponse[]>(`${this.apiUrl}/dossiers/recent`);
  }
}
