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

  getActiveAnnoncesCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/kpis/annonces-actives`);
  }

  getDossiersATraiterCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/kpis/dossiers-a-traiter`);
  }

  getRecentDossiers(): Observable<DossierResponse[]> {
    return this.http.get<DossierResponse[]>(`${this.apiUrl}/dossiers/recent`);
  }
}
