import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Cas d'usage n°1, lot B — bourse aux mandats (types partagés propriétaire / agence). */
export type MandateType = 'SIMPLE' | 'EXCLUSIVE';
export type CommissionKind = 'PERCENT' | 'FLAT';
export type CommissionPayer = 'SELLER' | 'BUYER' | 'SHARED';
export type RequestVisibility = 'MREQ_OPEN_MARKET' | 'MREQ_DIRECT';

export const SERVICE_LABELS: Record<string, string> = {
  ESTIMATION: 'Estimation',
  PHOTOS: 'Photos professionnelles',
  VISITS: 'Visites',
  NEGOTIATION: 'Négociation',
  LEGAL: 'Accompagnement juridique',
  TENANT_SELECTION: 'Sélection du locataire',
  RENT_MANAGEMENT: 'Gestion locative',
};

export const MANDATE_TYPE_LABELS: Record<string, string> = { SIMPLE: 'Mandat simple', EXCLUSIVE: 'Mandat exclusif' };
export const PAYER_LABELS: Record<string, string> = { SELLER: 'Propriétaire', BUYER: 'Acquéreur', SHARED: 'Partagée' };

export const REQUEST_STATUS: Record<string, { label: string; status: 'info' | 'warning' | 'success' | 'neutral' | 'error' }> = {
  MREQ_OPEN: { label: 'Ouverte', status: 'info' },
  MREQ_AWARDED: { label: 'Mandat confié', status: 'success' },
  MREQ_EXPIRED: { label: 'Expirée', status: 'neutral' },
  MREQ_CANCELLED: { label: 'Annulée', status: 'neutral' },
};

export const PROPOSAL_STATUS: Record<string, { label: string; status: 'info' | 'warning' | 'success' | 'neutral' | 'error' }> = {
  MPROP_SENT: { label: 'Reçue', status: 'info' },
  MPROP_SHORTLISTED: { label: 'Présélectionnée', status: 'warning' },
  MPROP_ACCEPTED: { label: 'Acceptée', status: 'success' },
  MPROP_DECLINED: { label: 'Non retenue', status: 'neutral' },
  MPROP_WITHDRAWN: { label: 'Retirée', status: 'neutral' },
  MPROP_EXPIRED: { label: 'Expirée', status: 'neutral' },
};

export const MANDATE_STATUS: Record<string, { label: string; status: 'info' | 'warning' | 'success' | 'neutral' | 'error' }> = {
  MANDATE_PENDING_SIGNATURE: { label: 'À signer', status: 'warning' },
  MANDATE_ACTIVE: { label: 'Actif', status: 'success' },
  MANDATE_COMPLETED: { label: 'Terminé', status: 'neutral' },
  MANDATE_TERMINATED: { label: 'Résilié', status: 'neutral' },
  MANDATE_EXPIRED: { label: 'Échu', status: 'neutral' },
};

/** « 2,5 % » ou « 15 000 MAD », et qui la paie. */
export function commissionLabel(kind: string, value: number, payer?: string): string {
  const v = kind === 'PERCENT' ? `${String(value).replace('.', ',')} %` : `${Number(value).toLocaleString('fr-FR')} MAD`;
  return payer ? `${v} · ${PAYER_LABELS[payer] ?? payer}` : v;
}

export interface AgencyCard {
  orgId: string;
  name: string;
  description: string | null;
  languages: string[];
  propertyTypes: string[];
  transactions: string[];
  districts: string[];
  rating: number | null;
  reviews: number;
}

export interface RequestCreate {
  propertyId: number;
  visibility: RequestVisibility;
  targetAgencyOrgId?: string | null;
  expectedPrice?: number | null;
  deadline?: string | null;
  mandateTypes: MandateType[];
  services: string[];
  commissionNote?: string | null;
  availability?: string | null;
  languages?: string | null;
  message?: string | null;
}

export interface OwnerProposal {
  id: number;
  agencyOrgId: string;
  agencyName: string;
  agentName: string | null;
  mandateType: MandateType;
  durationMonths: number;
  commissionKind: CommissionKind;
  commissionValue: number;
  commissionPayer: CommissionPayer;
  services: string[];
  estimateMin: number | null;
  estimateMax: number | null;
  message: string | null;
  status: string;
  unread: number;
  createdAt: string;
  agencyRating: number | null;
  agencyReviews: number;
}

export interface MandateOwnerInfo {
  name: string | null;
  phone: string | null;
  propertyTitle: string | null;
  propertyType: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  landTitleNumber: string | null;
  surface: number | null;
  rooms: number | null;
  expectedPrice: number | null;
}

export interface MandateView {
  id: number;
  propertyId: number;
  agencyOrgId: string;
  agencyName: string;
  mandateType: MandateType;
  durationMonths: number;
  commissionKind: CommissionKind;
  commissionValue: number;
  commissionPayer: CommissionPayer;
  status: string;
  startsAt: string;
  endsAt: string;
  signedAt: string | null;
  dossierId: number | null;
  annonceId: number | null;
  owner: MandateOwnerInfo | null;
  endReason: string | null;
  endedBy: 'OWNER' | 'AGENCY' | 'SYSTEM' | null;
  endedAt: string | null;
}

/** Lot C — motifs de fin de mandat (UC-P9). */
export const END_REASON_LABELS: Record<string, string> = {
  SOLD_BY_OWNER: 'Vendu ou loué par le propriétaire',
  SOLD_THIRD_PARTY: 'Vendu ou loué par un autre intermédiaire',
  WITHDRAWN_OWNER: 'Retiré du marché par le propriétaire',
  DEAL_CLOSED_AGENCY: 'Transaction conclue par l\'agence',
  WITHDRAWN_AGENCY: 'L\'agence s\'est retirée',
  NOT_SIGNED: 'Non signé dans le délai',
  TERM_REACHED: 'Arrivé à échéance',
};

/** Formulations du propriétaire quand il choisit lui-même le motif. */
export const OWNER_END_REASON_CHOICES: Record<string, string> = {
  SOLD_BY_OWNER: 'Je l\'ai vendu ou loué moi-même',
  SOLD_THIRD_PARTY: 'Vendu ou loué par un autre intermédiaire',
  WITHDRAWN_OWNER: 'Je retire mon bien du marché',
};

/** Formulations de l'agence quand elle choisit le motif. */
export const AGENCY_END_REASON_CHOICES: Record<string, string> = {
  DEAL_CLOSED_AGENCY: 'Nous avons conclu la transaction',
  SOLD_THIRD_PARTY: 'Vendu ou loué par un autre intermédiaire',
  WITHDRAWN_AGENCY: 'Nous nous retirons du mandat',
};

/** Agence recommandée pour une demande (§ 5.1, 5 au plus), déjà classée par pertinence. */
export interface RecommendedAgency {
  orgId: string;
  name: string;
  description: string | null;
  districts: string[];
  rating: number | null;
  reviews: number;
  invited: boolean;
  proposed: boolean;
}

export interface VisibleEvent {
  id: number;
  type: string;
  content: string;
  createdAt: string;
}

export interface AgencyListing {
  annonceId: number;
  title: string | null;
  status: string;
  contacts: number;
}

export interface AgencyReview {
  rating: number;
  comment: string | null;
  createdAt: string;
}

export type OfferStatus = 'OFFER_PENDING' | 'OFFER_ACCEPTED' | 'OFFER_REFUSED' | 'OFFER_COUNTERED' | 'OFFER_WITHDRAWN';
export type OfferDecision = 'ACCEPT' | 'REFUSE' | 'COUNTER';

/** Offre d'un acquéreur (anonyme) transmise par l'agence mandatée. */
export interface MandateOffer {
  id: number;
  amount: number;
  currency: string;
  buyerSummary: string | null;
  conditions: string | null;
  validUntil: string | null;
  status: OfferStatus;
  counterAmount: number | null;
  ownerComment: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export const OFFER_STATUS: Record<string, { label: string; status: 'info' | 'warning' | 'success' | 'neutral' | 'error' }> = {
  OFFER_PENDING: { label: 'En attente de réponse', status: 'warning' },
  OFFER_ACCEPTED: { label: 'Acceptée', status: 'success' },
  OFFER_REFUSED: { label: 'Refusée', status: 'neutral' },
  OFFER_COUNTERED: { label: 'Contre-proposition', status: 'info' },
  OFFER_WITHDRAWN: { label: 'Retirée', status: 'neutral' },
};

/** « 1 450 000 MAD ». */
export function madLabel(amount: number | null | undefined): string {
  return amount == null ? '—' : `${Math.round(Number(amount)).toLocaleString('fr-FR')} MAD`;
}

/** Suivi d'un mandat par le propriétaire (UC-P8, UC-P9). */
export interface MandateFollowUp {
  mandate: MandateView;
  requestId: number | null;
  proposalId: number | null;
  propertyTitle: string | null;
  listings: AgencyListing[];
  events: VisibleEvent[];
  offers: MandateOffer[];
  canEnd: boolean;
  endReasons: string[];
  canReview: boolean;
  review: AgencyReview | null;
}

/** « 4,6 / 5 · 12 avis », ou null sans avis. */
export function ratingLabel(rating: number | null | undefined, reviews: number | null | undefined): string | null {
  if (rating == null || !reviews) return null;
  const r = (Math.round(rating * 10) / 10).toLocaleString('fr-FR');
  return `${r} / 5 · ${reviews} avis`;
}

export interface OwnerRequest {
  id: number;
  propertyId: number;
  propertyTitle: string | null;
  visibility: RequestVisibility;
  targetAgencyOrgId: string | null;
  targetAgencyName: string | null;
  objective: 'SALE' | 'RENT';
  city: string;
  district: string | null;
  expectedPrice: number | null;
  deadline: string | null;
  mandateTypes: MandateType[];
  services: string[];
  commissionNote: string | null;
  availability: string | null;
  languages: string | null;
  message: string | null;
  status: string;
  maxProposals: number;
  openedAt: string | null;
  expiresAt: string | null;
  canOpenToMarket: boolean;
  proposals: OwnerProposal[];
  mandates: MandateView[];
}

export interface MarketplaceMessage {
  id: number;
  side: 'OWNER' | 'AGENCY';
  authorName: string | null;
  body: string;
  createdAt: string;
}

export interface MarketplaceThread {
  proposalId: number;
  masked: boolean;
  closed: boolean;
  messages: MarketplaceMessage[];
}

/** Côté propriétaire : `/api/v1/owner/...`. */
@Injectable({ providedIn: 'root' })
export class OwnerMandateApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/owner';

  agencies(city: string, transaction?: string): Observable<AgencyCard[]> {
    const params: Record<string, string> = { city };
    if (transaction) params['transaction'] = transaction;
    return this.http.get<AgencyCard[]>(`${this.base}/agencies`, { params });
  }

  requests(): Observable<OwnerRequest[]> {
    return this.http.get<OwnerRequest[]>(`${this.base}/mandate-requests`);
  }

  request(id: number): Observable<OwnerRequest> {
    return this.http.get<OwnerRequest>(`${this.base}/mandate-requests/${id}`);
  }

  create(body: RequestCreate): Observable<OwnerRequest> {
    return this.http.post<OwnerRequest>(`${this.base}/mandate-requests`, body);
  }

  cancel(id: number): Observable<OwnerRequest> {
    return this.http.post<OwnerRequest>(`${this.base}/mandate-requests/${id}/cancel`, {});
  }

  openToMarket(id: number): Observable<OwnerRequest> {
    return this.http.post<OwnerRequest>(`${this.base}/mandate-requests/${id}/open-to-market`, {});
  }

  shortlist(proposalId: number): Observable<OwnerRequest> {
    return this.http.post<OwnerRequest>(`${this.base}/proposals/${proposalId}/shortlist`, {});
  }

  decline(proposalId: number): Observable<OwnerRequest> {
    return this.http.post<OwnerRequest>(`${this.base}/proposals/${proposalId}/decline`, {});
  }

  thread(proposalId: number): Observable<MarketplaceThread> {
    return this.http.get<MarketplaceThread>(`${this.base}/proposals/${proposalId}/messages`);
  }

  send(proposalId: number, body: string): Observable<MarketplaceThread> {
    return this.http.post<MarketplaceThread>(`${this.base}/proposals/${proposalId}/messages`, { body });
  }

  startAccept(proposalId: number): Observable<{ channel: string }> {
    return this.http.post<{ channel: string }>(`${this.base}/proposals/${proposalId}/accept/start`, {});
  }

  accept(proposalId: number, code: string): Observable<MandateView> {
    return this.http.post<MandateView>(`${this.base}/proposals/${proposalId}/accept`, { code });
  }

  mandates(): Observable<MandateView[]> {
    return this.http.get<MandateView[]>(`${this.base}/mandates`);
  }

  // ---------------------------------------------------------------- lot C

  recommended(requestId: number): Observable<RecommendedAgency[]> {
    return this.http.get<RecommendedAgency[]>(`${this.base}/mandate-requests/${requestId}/recommended`);
  }

  invite(requestId: number, agencyOrgId: string): Observable<RecommendedAgency[]> {
    return this.http.post<RecommendedAgency[]>(`${this.base}/mandate-requests/${requestId}/invitations`, { agencyOrgId });
  }

  mandate(id: number): Observable<MandateFollowUp> {
    return this.http.get<MandateFollowUp>(`${this.base}/mandates/${id}`);
  }

  endMandate(id: number, reason: string): Observable<MandateFollowUp> {
    return this.http.post<MandateFollowUp>(`${this.base}/mandates/${id}/end`, { reason });
  }

  decideOffer(id: number, offerId: number, body: { decision: OfferDecision; counterAmount?: number | null; comment?: string | null }): Observable<MandateFollowUp> {
    return this.http.post<MandateFollowUp>(`${this.base}/mandates/${id}/offers/${offerId}/decision`, body);
  }

  review(id: number, rating: number, comment: string | null): Observable<MandateFollowUp> {
    return this.http.post<MandateFollowUp>(`${this.base}/mandates/${id}/review`, { rating, comment });
  }

  requestPropertyVerification(propertyId: number): Observable<{ verificationStatus: string }> {
    return this.http.post<{ verificationStatus: string }>(`${this.base}/properties/${propertyId}/verification`, {});
  }
}
