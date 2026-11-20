import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BuyerMatch, FollowUpKind, PitchChannel, ReplyIntent } from './annonce-buyer-matches-api.service';

export type InboxSection = 'FOLLOW_UP' | 'VISIT_TO_PLAN' | 'RECENT_REPLY' | 'UPCOMING_VISIT';

/** Ligne de la page « Relances ». */
export interface BuyerInboxItem {
  matchId: number;
  section: InboxSection;
  annonceId: number;
  annonceTitle: string | null;
  annonceCity: string | null;
  dossierId: number;
  leadName: string | null;
  score: number;
  replyIntent: ReplyIntent | null;
  replyExcerpt: string | null;
  replyAt: string | null;
  followUpKind: FollowUpKind | null;
  followUpSince: string | null;
  proposedStart: string | null;
  visitAppointmentId: number | null;
  visitStart: string | null;
  pitchedAt: string | null;
  pitchChannel: PitchChannel | null;
  /** L'agent a écrit au client depuis sa dernière réponse. */
  answered: boolean;
}

export interface BuyerInboxResponse {
  items: BuyerInboxItem[];
  counts: Record<InboxSection, number>;
}

/** Vue « correspondance » d'une ligne, pour réutiliser l'éditeur de relance et la planification. */
export function toBuyerMatch(i: BuyerInboxItem): BuyerMatch {
  return {
    id: i.matchId,
    dossierId: i.dossierId,
    leadName: i.leadName,
    dossierStatus: null,
    score: i.score,
    reasons: [],
    alerts: [],
    status: 'SEEN',
    createdAt: null,
    pitchedAt: i.pitchedAt,
    pitchChannel: i.pitchChannel,
    replyIntent: i.replyIntent,
    replyExcerpt: i.replyExcerpt,
    replyAt: i.replyAt,
    proposedStart: i.proposedStart,
    // créneau de 45 min par défaut (la durée reste modifiable)
    proposedEnd: i.proposedStart ? plus45(i.proposedStart) : null,
    visitAppointmentId: i.visitAppointmentId,
    followUpKind: i.followUpKind,
  };
}

function plus45(iso: string): string {
  const d = new Date(`${iso.slice(0, 19)}Z`);
  return new Date(d.getTime() + 45 * 60000).toISOString().slice(0, 19);
}

@Injectable({ providedIn: 'root' })
export class BuyerInboxApiService {
  constructor(private http: HttpClient) {}

  /** @param mine seulement les dossiers de l'agent connecté */
  inbox(mine: boolean): Observable<BuyerInboxResponse> {
    return this.http.get<BuyerInboxResponse>('/api/v1/buyer-inbox', { params: new HttpParams().set('mine', mine) });
  }
}
