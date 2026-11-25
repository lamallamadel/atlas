import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/** Modération des annonces de particuliers (plateforme, rôle SUPER_ADMIN). */
export interface PendingOwnerAnnonce {
  id: number;
  ownerOrgId: string;
  ownerName: string;
  title: string;
  description: string | null;
  city: string | null;
  district: string | null;
  price: number | null;
  fraudScore: number | null;
  duplicateStatut: string | null;
  photoCount: number;
  photoIds: number[];
  requestedAt: string;
}

@Injectable({ providedIn: 'root' })
export class OwnerModerationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/admin/moderation/owner-annonces';

  pending(): Observable<PendingOwnerAnnonce[]> {
    return this.http.get<PendingOwnerAnnonce[]>(this.base);
  }

  photoBlobUrl(annonceId: number, mediaId: number): Observable<string> {
    return this.http
      .get(`${this.base}/${annonceId}/photos/${mediaId}`, { responseType: 'blob' })
      .pipe(map(blob => URL.createObjectURL(blob)));
  }

  approve(id: number, note?: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/approve`, { note: note ?? null });
  }

  reject(id: number, note: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/reject`, { note });
  }
}
