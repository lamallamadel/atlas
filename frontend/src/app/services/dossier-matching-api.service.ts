import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DossierSearchCriteria {
  transactionTypes: string[];
  categories: string[];
  cities: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  /** null = indifférent */
  furnished: boolean | null;
  equipments: string[];
  acceptedConditions: string[];
}

export type MatchScope = 'ALL' | 'OFF_MARKET';

export interface DossierMatch {
  annonceId: number;
  title: string;
  city?: string;
  category?: string;
  type?: string;
  status?: string;
  price?: number;
  currency?: string;
  surface?: number;
  photoUrl?: string | null;
  score: number;
  reasons: string[];
  alerts: string[];
  photosAnalyzed: boolean;
}

export interface DossierMatchesResponse {
  scope: MatchScope;
  totalCandidates: number;
  excluded: Record<string, number>;
  matches: DossierMatch[];
  criteriaUpdatedAt: string | null;
}

export interface CriteriaSuggestion {
  /** Seuls les champs justifiés par une citation du client sont renseignés. */
  suggestion: Partial<DossierSearchCriteria>;
  /** Citation du client pour chaque champ suggéré. */
  evidence: Record<string, string>;
  /** openai, ollama ou regles (sans IA). */
  engine: string;
  notesUsed: number;
  messagesUsed: number;
}

@Injectable({ providedIn: 'root' })
export class DossierMatchingApiService {
  constructor(private http: HttpClient) {}

  private base(dossierId: number): string {
    return `/api/v1/dossiers/${dossierId}`;
  }

  /** Renvoie null quand le dossier n'a pas encore de critères (HTTP 204). */
  getCriteria(dossierId: number): Observable<DossierSearchCriteria | null> {
    return this.http.get<DossierSearchCriteria | null>(`${this.base(dossierId)}/search-criteria`);
  }

  saveCriteria(dossierId: number, criteria: DossierSearchCriteria): Observable<DossierSearchCriteria> {
    return this.http.put<DossierSearchCriteria>(`${this.base(dossierId)}/search-criteria`, criteria);
  }

  /** N'enregistre rien : la suggestion est à relire puis appliquer au formulaire. */
  suggestCriteria(dossierId: number): Observable<CriteriaSuggestion> {
    return this.http.post<CriteriaSuggestion>(`${this.base(dossierId)}/search-criteria/suggest`, null);
  }

  matches(dossierId: number, scope: MatchScope = 'ALL', limit = 20): Observable<DossierMatchesResponse> {
    const params = new HttpParams().set('scope', scope).set('limit', String(limit));
    return this.http.get<DossierMatchesResponse>(`${this.base(dossierId)}/matches`, { params });
  }
}
