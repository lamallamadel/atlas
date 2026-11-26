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
}
