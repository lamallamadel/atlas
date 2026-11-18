import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  /** Dernière proposition envoyée au client (null si jamais proposé). */
  pitchedAt: string | null;
  pitchChannel: PitchChannel | null;
}

export type PitchChannel = 'WHATSAPP' | 'SMS';
export type PitchLanguage = 'fr' | 'ar' | 'en';

/** Brouillon de message à relire : rien n'est envoyé. */
export interface PitchDraft {
  message: string;
  /** openai, ollama ou modele (texte sans IA). */
  engine: string;
  /** Pourquoi le texte de l'IA a été écarté (chiffre inventé…), sinon null. */
  aiRejection: string | null;
  language: PitchLanguage;
  channel: PitchChannel;
  to: string | null;
  consentStatus: string;
  /** Le client a écrit sur WhatsApp il y a moins de 24 h (null pour SMS). */
  whatsappWindowOpen: boolean | null;
  /** Raisons empêchant l'envoi (vide si l'envoi est possible). */
  blockers: string[];
  warnings: string[];
  maxLength: number;
  pitchedAt: string | null;
  pitchChannel: PitchChannel | null;
}

export interface PitchSendResult {
  outboundMessageId: number;
  status: string | null;
  channel: PitchChannel;
  pitchedAt: string;
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

  /** Brouillon rédigé par l'IA (ou un modèle sans IA) : rien n'est envoyé. */
  draftPitch(annonceId: number, matchId: number, language: PitchLanguage, channel: PitchChannel): Observable<PitchDraft> {
    const params = new HttpParams().set('language', language).set('channel', channel);
    return this.http.post<PitchDraft>(`${this.base(annonceId)}/${matchId}/pitch/draft`, null, { params });
  }

  /** Envoie le message relu et validé par l'agent. */
  sendPitch(
    annonceId: number,
    matchId: number,
    body: { message: string; channel: PitchChannel; language: PitchLanguage },
  ): Observable<PitchSendResult> {
    return this.http.post<PitchSendResult>(`${this.base(annonceId)}/${matchId}/pitch/send`, body);
  }
}
