import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AnnonceReportReason =
  'REPORT_FRAUD' | 'REPORT_INCORRECT_INFO' | 'REPORT_DUPLICATE' | 'REPORT_SPAM' | 'REPORT_OTHER';

export type AnnonceReportResolution = 'DISMISSED' | 'ANNONCE_SUSPENDED';

/** Signalement d'une annonce par un visiteur du portail. */
export interface AnnonceReport {
  id: number;
  annonceId: number;
  reasonCode: AnnonceReportReason;
  comment?: string | null;
  reporterEmail?: string | null;
  status: 'OPEN' | 'CLOSED';
  resolution?: AnnonceReportResolution | null;
  resolutionComment?: string | null;
  closedBy?: string | null;
  closedAt?: string | null;
  createdAt: string;
}

export const REPORT_REASON_LABELS: Record<AnnonceReportReason, string> = {
  REPORT_FRAUD: 'Arnaque ou annonce suspecte',
  REPORT_INCORRECT_INFO: 'Informations fausses',
  REPORT_DUPLICATE: 'Annonce en double',
  REPORT_SPAM: 'Contenu inapproprié',
  REPORT_OTHER: 'Autre',
};

@Injectable({ providedIn: 'root' })
export class AnnonceReportApiService {
  private readonly http = inject(HttpClient);

  listForAnnonce(annonceId: number): Observable<AnnonceReport[]> {
    return this.http.get<AnnonceReport[]>(`/api/v1/annonces/${annonceId}/reports`);
  }

  /** File de l'agence : OPEN (défaut), CLOSED ou ALL. */
  listForAgency(status: 'OPEN' | 'CLOSED' | 'ALL' = 'OPEN'): Observable<AnnonceReport[]> {
    return this.http.get<AnnonceReport[]>('/api/v1/annonce-reports', { params: new HttpParams().set('status', status) });
  }

  close(reportId: number, resolution: AnnonceReportResolution, comment?: string | null): Observable<AnnonceReport> {
    return this.http.post<AnnonceReport>(`/api/v1/annonce-reports/${reportId}/close`, { resolution, comment: comment ?? null });
  }
}
