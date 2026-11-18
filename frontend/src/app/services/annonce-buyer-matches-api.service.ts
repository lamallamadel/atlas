import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type BuyerMatchStatus = 'NEW' | 'SEEN' | 'DISMISSED';

/** Dossier acheteur dont les critères correspondent à l'annonce. */
export interface BuyerMatch {
  id: number;
  dossierId: number;
  leadName: string | null;
  dossierStatus: string | null;
  score: number;
  reasons: string[];
  alerts: string[];
  status: BuyerMatchStatus;
  createdAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AnnonceBuyerMatchesApiService {
  constructor(private http: HttpClient) {}

  private base(annonceId: number): string {
    return `/api/v1/annonces/${annonceId}/buyer-matches`;
  }

  /** Les correspondances NEW passent à SEEN côté serveur après cette lecture. */
  list(annonceId: number): Observable<BuyerMatch[]> {
    return this.http.get<BuyerMatch[]>(this.base(annonceId));
  }

  /** Relance le calcul (HTTP 503 si le service IA est indisponible). */
  refresh(annonceId: number): Observable<BuyerMatch[]> {
    return this.http.post<BuyerMatch[]>(`${this.base(annonceId)}/refresh`, null);
  }

  dismiss(annonceId: number, matchId: number): Observable<void> {
    return this.http.post<void>(`${this.base(annonceId)}/${matchId}/dismiss`, null);
  }

  undismiss(annonceId: number, matchId: number): Observable<void> {
    return this.http.delete<void>(`${this.base(annonceId)}/${matchId}/dismiss`);
  }
}
