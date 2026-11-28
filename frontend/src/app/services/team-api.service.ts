import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import type { AgencyRole } from './agency-role';

/** Membre de l'agence (GET /api/v1/team). */
export interface TeamMember {
  userId: string;
  name: string;
  email?: string | null;
  /** Inconnu (`null`) quand l'annuaire Keycloak est indisponible. */
  role?: AgencyRole | null;
  enabled?: boolean;
}

/** Réglages d'équipe de l'agence (GET/PUT /api/v1/team/settings). */
export type LeadRouting = 'SHARED_QUEUE' | 'LISTING_AGENT' | 'ROUND_ROBIN';

export interface TeamSettings {
  /** Les agents ne voient que leurs dossiers et ceux à attribuer. */
  restrictAgentsToOwnDossiers: boolean;
  /** Distribution des leads du portail (file partagée par défaut). */
  leadRouting?: LeadRouting;
}

export interface InviteRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: AgencyRole;
}

export interface InviteResponse {
  id: string;
  email: string;
  status: string;
  role: AgencyRole;
}

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly http = inject(HttpClient);
  private members$?: Observable<TeamMember[]>;

  /** Membres actifs, pour les sélecteurs d'agent ; mis en cache pour la session. */
  members(): Observable<TeamMember[]> {
    this.members$ ??= this.http.get<TeamMember[]>('/api/v1/team').pipe(shareReplay(1));
    return this.members$;
  }

  /** Tous les membres, comptes désactivés compris (écran « Équipe »), sans cache. */
  allMembers(): Observable<TeamMember[]> {
    const params = new HttpParams().set('includeDisabled', 'true');
    return this.http.get<TeamMember[]>('/api/v1/team', { params });
  }

  invite(request: InviteRequest): Observable<InviteResponse> {
    return this.http.post<InviteResponse>('/api/v1/users/invite', request).pipe(tap(() => this.invalidate()));
  }

  changeRole(userId: string, role: AgencyRole): Observable<TeamMember> {
    return this.http
      .put<TeamMember>(`/api/v1/team/${encodeURIComponent(userId)}/role`, { role })
      .pipe(tap(() => this.invalidate()));
  }

  setEnabled(userId: string, enabled: boolean): Observable<TeamMember> {
    return this.http
      .put<TeamMember>(`/api/v1/team/${encodeURIComponent(userId)}/enabled`, { enabled })
      .pipe(tap(() => this.invalidate()));
  }

  settings(): Observable<TeamSettings> {
    return this.http.get<TeamSettings>('/api/v1/team/settings');
  }

  updateSettings(settings: Partial<TeamSettings>): Observable<TeamSettings> {
    return this.http.put<TeamSettings>('/api/v1/team/settings', settings);
  }

  private invalidate(): void {
    this.members$ = undefined;
  }
}
