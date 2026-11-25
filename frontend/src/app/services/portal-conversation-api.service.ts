import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { SILENT_HTTP_ERRORS } from '../interceptors/correlation-id.interceptor';
import { Observable } from 'rxjs';
import type { ThreadMessage, VisitBooking, VisitSlot } from './owner-api.service';

/** Conversation vue par le prospect (sans compte), à partir du lien reçu. */
export interface ProspectConversation {
  ownerName: string;
  prospectName: string | null;
  annonceId: number | null;
  annonceTitle: string | null;
  annonceCity: string | null;
  initialMessage: string | null;
  closed: boolean;
  messages: ThreadMessage[];
  proposals: VisitSlot[];
  visits: VisitBooking[];
}

/**
 * Cas d'usage n°1 (UC-P4) — le jeton du lien part dans un en-tête, pas dans l'URL de l'API,
 * pour ne pas apparaître dans les journaux du serveur.
 */
@Injectable({ providedIn: 'root' })
export class PortalConversationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/portal/conversation';

  private headers(token: string): HttpHeaders {
    return new HttpHeaders({ 'X-Conversation-Token': token });
  }

  view(token: string): Observable<ProspectConversation> {
    // Lien périmé : la page affiche son propre message, sans notification d'erreur globale.
    return this.http.get<ProspectConversation>(this.base, { headers: this.headers(token), context: new HttpContext().set(SILENT_HTTP_ERRORS, true) });
  }

  send(token: string, body: string): Observable<ProspectConversation> {
    return this.http.post<ProspectConversation>(`${this.base}/messages`, { body }, { headers: this.headers(token) });
  }

  accept(token: string, proposalId: number): Observable<ProspectConversation> {
    return this.http.post<ProspectConversation>(`${this.base}/visit-proposals/${proposalId}/accept`, {}, { headers: this.headers(token) });
  }
}
