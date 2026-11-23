import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

/** Membre de l'agence (GET /api/v1/team). */
export interface TeamMember {
  userId: string;
  name: string;
  email?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly http = inject(HttpClient);
  private members$?: Observable<TeamMember[]>;

  /** Membres de l'agence, mis en cache pour la session. */
  members(): Observable<TeamMember[]> {
    this.members$ ??= this.http.get<TeamMember[]>('/api/v1/team').pipe(shareReplay(1));
    return this.members$;
  }
}
