import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { AgencyReview, CommissionKind, CommissionPayer, MandateOffer, MandateType, MandateView, MarketplaceThread } from './mandate-api.service';

/** Demande vue par une agence : anonymisée (ni adresse, ni téléphone). */
export interface AgencyRequest {
  id: number;
  direct: boolean;
  objective: 'SALE' | 'RENT';
  propertyType: string | null;
  city: string;
  district: string | null;
  surface: number | null;
  rooms: number | null;
  expectedPrice: number | null;
  deadline: string | null;
  mandateTypes: MandateType[];
  services: string[];
  commissionNote: string | null;
  availability: string | null;
  languages: string | null;
  message: string | null;
  ownerName: string;
  status: string;
  openedAt: string | null;
  expiresAt: string | null;
  canPropose: boolean;
  cannotProposeReason: string | null;
  myProposal: AgencyProposal | null;
  /** Pertinence 0–100 pour l'agence qui consulte (§ 5.1). */
  relevance: number;
  /** Acquéreurs compatibles dans le portefeuille de l'agence qui consulte (§ 5.2). */
  compatibleBuyers: number;
  invited: boolean;
  ownerVerified: boolean;
  propertyVerified: boolean;
}

export interface AgencyProposal {
  id: number;
  requestId: number;
  city: string;
  district: string | null;
  objective: 'SALE' | 'RENT';
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
  mandateId: number | null;
  createdAt: string;
}

export interface ProposalCreate {
  mandateType: MandateType;
  durationMonths: number;
  commissionKind: CommissionKind;
  commissionValue: number;
  commissionPayer: CommissionPayer;
  services: string[];
  estimateMin?: number | null;
  estimateMax?: number | null;
  message?: string | null;
}

export interface AgencyZone {
  city: string;
  district: string | null;
}

export interface AgencySettings {
  orgId: string;
  verified: boolean;
  displayName: string | null;
  description: string | null;
  languages: string[];
  propertyTypes: string[];
  transactions: string[];
  zones: AgencyZone[];
  /** Lot C : note moyenne et avis vérifiés reçus (les 20 derniers). */
  rating: number | null;
  reviews: number;
  recentReviews: AgencyReview[];
}

export interface OfferCreate {
  amount: number;
  buyerSummary?: string | null;
  conditions?: string | null;
  validUntil?: string | null;
}

export interface AgencyProfileRequest {
  displayName: string;
  description?: string | null;
  languages: string[];
  propertyTypes: string[];
  transactions: string[];
}

export interface PendingPropertyVerification {
  id: number;
  title: string | null;
  city: string | null;
  district: string | null;
  landTitleNumber: string;
  ownerOrgId: string;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerVerified: boolean;
  requestedAt: string;
}

/** Vérification de l'agence (accès à la bourse) : statut, pièces déposées, ce qui manque. */
export interface AgencyVerification {
  status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NONE';
  rc: string | null;
  ice: string | null;
  contact: string | null;
  requestedAt: string | null;
  /** Motif d'un refus, écrit par l'équipe Atlas. */
  note: string | null;
  missing: ('PROFILE' | 'ZONES')[];
  openRequestsInZones: number;
}

export interface PendingAgencyVerification {
  orgId: string;
  name: string;
  rc: string | null;
  ice: string | null;
  contact: string | null;
  requestedAt: string | null;
  cities: string[];
}

/** Côté agence : `/api/v1/marketplace/...` et le profil `/api/v1/agency/marketplace-profile`. */
@Injectable({ providedIn: 'root' })
export class MarketplaceApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/marketplace';
  private readonly profileBase = '/api/v1/agency/marketplace-profile';

  market(): Observable<AgencyRequest[]> {
    return this.http.get<AgencyRequest[]>(`${this.base}/requests`);
  }

  direct(): Observable<AgencyRequest[]> {
    return this.http.get<AgencyRequest[]>(`${this.base}/direct-requests`);
  }

  request(id: number): Observable<AgencyRequest> {
    return this.http.get<AgencyRequest>(`${this.base}/requests/${id}`);
  }

  propose(requestId: number, body: ProposalCreate): Observable<AgencyRequest> {
    return this.http.post<AgencyRequest>(`${this.base}/requests/${requestId}/proposals`, body);
  }

  declineDirect(requestId: number): Observable<AgencyRequest> {
    return this.http.post<AgencyRequest>(`${this.base}/requests/${requestId}/decline`, {});
  }

  proposals(): Observable<AgencyProposal[]> {
    return this.http.get<AgencyProposal[]>(`${this.base}/proposals`);
  }

  proposal(id: number): Observable<AgencyProposal> {
    return this.http.get<AgencyProposal>(`${this.base}/proposals/${id}`);
  }

  withdraw(id: number): Observable<AgencyProposal> {
    return this.http.post<AgencyProposal>(`${this.base}/proposals/${id}/withdraw`, {});
  }

  thread(proposalId: number): Observable<MarketplaceThread> {
    return this.http.get<MarketplaceThread>(`${this.base}/proposals/${proposalId}/messages`);
  }

  send(proposalId: number, body: string): Observable<MarketplaceThread> {
    return this.http.post<MarketplaceThread>(`${this.base}/proposals/${proposalId}/messages`, { body });
  }

  mandates(): Observable<MandateView[]> {
    return this.http.get<MandateView[]>(`${this.base}/mandates`);
  }

  markSigned(id: number): Observable<MandateView> {
    return this.http.post<MandateView>(`${this.base}/mandates/${id}/signed`, {});
  }

  endMandate(id: number, reason: string): Observable<MandateView> {
    return this.http.post<MandateView>(`${this.base}/mandates/${id}/end`, { reason });
  }

  offers(id: number): Observable<MandateOffer[]> {
    return this.http.get<MandateOffer[]>(`${this.base}/mandates/${id}/offers`);
  }

  submitOffer(id: number, body: OfferCreate): Observable<MandateOffer[]> {
    return this.http.post<MandateOffer[]>(`${this.base}/mandates/${id}/offers`, body);
  }

  withdrawOffer(id: number, offerId: number): Observable<MandateOffer[]> {
    return this.http.post<MandateOffer[]>(`${this.base}/mandates/${id}/offers/${offerId}/withdraw`, {});
  }

  createAnnonce(id: number): Observable<{ annonceId: number }> {
    return this.http.post<{ annonceId: number }>(`${this.base}/mandates/${id}/annonce`, {});
  }

  settings(): Observable<AgencySettings> {
    return this.http.get<AgencySettings>(this.profileBase);
  }

  saveProfile(body: AgencyProfileRequest): Observable<AgencySettings> {
    return this.http.put<AgencySettings>(this.profileBase, body);
  }

  saveZones(zones: AgencyZone[]): Observable<AgencySettings> {
    return this.http.put<AgencySettings>(`${this.profileBase}/zones`, zones);
  }

  verification(): Observable<AgencyVerification> {
    return this.http.get<AgencyVerification>(`${this.profileBase}/verification`);
  }

  requestVerification(body: { rc: string; ice: string; contact?: string | null }): Observable<AgencyVerification> {
    return this.http.post<AgencyVerification>(`${this.profileBase}/verification`, body);
  }

  /** Super-admin : vérification d'une agence ; un refus porte un motif montré à l'agence. */
  setVerified(orgId: string, verified: boolean, note?: string | null): Observable<{ orgId: string; verified: boolean }> {
    return this.http.put<{ orgId: string; verified: boolean }>(`/api/v1/admin/agencies/${encodeURIComponent(orgId)}/verification`, { verified, note: note ?? null });
  }

  /** Super-admin : demandes de vérification d'agences en attente. */
  pendingAgencies(): Observable<PendingAgencyVerification[]> {
    return this.http.get<PendingAgencyVerification[]>('/api/v1/admin/verifications/agencies');
  }

  /** Super-admin : badge « Propriétaire vérifié » (pièce d'identité contrôlée, non conservée). */
  setOwnerVerified(orgId: string, verified: boolean): Observable<{ orgId: string; verified: boolean }> {
    return this.http.put<{ orgId: string; verified: boolean }>(`/api/v1/admin/owners/${encodeURIComponent(orgId)}/verification`, { verified });
  }

  /** Super-admin : titres fonciers en attente de contrôle. */
  pendingProperties(): Observable<PendingPropertyVerification[]> {
    return this.http.get<PendingPropertyVerification[]>('/api/v1/admin/verifications/properties');
  }

  decideProperty(id: number, verified: boolean): Observable<{ propertyId: number; verified: boolean }> {
    return this.http.put<{ propertyId: number; verified: boolean }>(`/api/v1/admin/properties/${id}/verification`, { verified });
  }
}
