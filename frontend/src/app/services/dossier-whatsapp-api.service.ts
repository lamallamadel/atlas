import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WhatsAppReplyResponse {
  outboundMessageId: number;
  messageId: number;
  status: string;
}

/** Réponse de l'agent au client sur WhatsApp (fenêtre de 24 h, accord « suivi du dossier »). */
@Injectable({ providedIn: 'root' })
export class DossierWhatsAppApiService {
  private http = inject(HttpClient);

  reply(dossierId: number, message: string): Observable<WhatsAppReplyResponse> {
    return this.http.post<WhatsAppReplyResponse>(`/api/v1/dossiers/${dossierId}/whatsapp/reply`, { message });
  }
}
