import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/** Cas d'usage n°1 — espace propriétaire (`/api/v1/owner/**`, rôle OWNER). */

export type OwnerTransaction = 'SALE' | 'RENT';

export interface OwnerPhoto {
  id: number;
  url: string;
  fileName?: string;
}

export interface OwnerAnnonce {
  id: number;
  propertyId: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  /** DRAFT, PUBLISHED, SUSPENDED, ARCHIVED */
  status: string;
  /** MOD_PENDING, MOD_APPROVED, MOD_REJECTED ou null */
  moderationStatus: string | null;
  moderationNote: string | null;
  blockers: string[];
  photos: OwnerPhoto[];
}

export interface OwnerProperty {
  id: number;
  title: string;
  propertyType: string | null;
  transactionType: OwnerTransaction;
  city: string;
  district: string | null;
  address: string | null;
  surface: number | null;
  rooms: number | null;
  expectedPrice: number | null;
  currency: string | null;
  description: string | null;
  landTitleNumber: string | null;
  verificationStatus: string;
  annonce: OwnerAnnonce | null;
}

export type OwnerPropertyRequest = Omit<OwnerProperty, 'id' | 'currency' | 'verificationStatus' | 'annonce'>;

export interface OwnerListingRequest {
  title: string;
  description: string;
  price: number | null;
}

export interface OwnerStatusOption {
  code: string;
  label: string;
}

export interface OwnerLead {
  id: number;
  annonceId: number | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  statusCode: string;
  statusLabel: string;
  next: OwnerStatusOption[];
  /** Messages du prospect pas encore lus. */
  unread: number;
  createdAt: string;
}

/** Message d'une conversation de la plateforme (propriétaire ↔ prospect). */
export interface ThreadMessage {
  id: number;
  author: 'OWNER' | 'PROSPECT';
  body: string;
  at: string;
}

export interface VisitSlot {
  id: number;
  start: string;
  end: string;
}

export interface VisitBooking {
  id: number;
  start: string;
  end: string;
  status: string;
}

export interface SlotRequest {
  start: string;
  end: string;
}

export interface OwnerConversation {
  leadId: number;
  prospectName: string | null;
  prospectPhone: string | null;
  prospectEmail: string | null;
  initialMessage: string | null;
  statusCode: string;
  statusLabel: string;
  next: OwnerStatusOption[];
  annonceTitle: string | null;
  closed: boolean;
  messages: ThreadMessage[];
  proposals: VisitSlot[];
  visits: VisitBooking[];
}

export interface OwnerProfile {
  displayName: string;
  phone: string;
  memberSince: string;
}

export interface OwnerSignupComplete {
  phone: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string | null;
  password: string;
  acceptTerms: boolean;
}

/** Où en est l'annonce, en une étiquette lisible par le propriétaire. */
export function ownerAnnonceState(a: OwnerAnnonce | null): { label: string; status: 'draft' | 'warning' | 'active' | 'error' | 'paused' } {
  if (!a) return { label: 'Pas d\'annonce', status: 'draft' };
  if (a.status === 'PUBLISHED') return { label: 'En ligne', status: 'active' };
  if (a.moderationStatus === 'MOD_PENDING') return { label: 'En vérification', status: 'warning' };
  if (a.moderationStatus === 'MOD_REJECTED') return { label: 'À corriger', status: 'error' };
  if (a.status === 'SUSPENDED') return { label: 'Retirée', status: 'paused' };
  return { label: 'Brouillon', status: 'draft' };
}

/** Mandat en cours sur un bien, tel que l'accueil du propriétaire le résume. */
export interface OwnerMandateSummary {
  status: string;
  agencyName: string;
  annonceId: number | null;
}

/**
 * État du bien pour son propriétaire : un mandat en cours prime sur sa propre annonce (sous
 * mandat exclusif, l'annonce du propriétaire est suspendue et c'est celle de l'agence qui est en
 * ligne). Sans mandat en cours, l'état de son annonce.
 */
export function ownerPropertyState(
  annonce: OwnerAnnonce | null,
  mandate: OwnerMandateSummary | null,
): { label: string; status: 'draft' | 'warning' | 'active' | 'error' | 'paused'; detail: string | null } {
  if (mandate?.status === 'MANDATE_ACTIVE') {
    return {
      label: mandate.annonceId ? 'En ligne' : 'Sous mandat',
      status: 'active',
      detail: mandate.annonceId
        ? `Annonce publiée par ${mandate.agencyName}`
        : `Confié à ${mandate.agencyName}, annonce en préparation`,
    };
  }
  if (mandate?.status === 'MANDATE_PENDING_SIGNATURE') {
    return { label: 'Mandat à signer', status: 'warning', detail: `Avec ${mandate.agencyName}` };
  }
  return { ...ownerAnnonceState(annonce), detail: null };
}

@Injectable({ providedIn: 'root' })
export class OwnerApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/owner';

  // ── Inscription (publique, sans organisation) ──
  startSignup(phone: string): Observable<{ status: string; channel: string }> {
    return this.http.post<{ status: string; channel: string }>('/api/v1/portal/owner/signup/start', { phone });
  }

  completeSignup(request: OwnerSignupComplete): Observable<{ status: string; username: string }> {
    return this.http.post<{ status: string; username: string }>('/api/v1/portal/owner/signup/complete', request);
  }

  // ── Espace propriétaire ──
  me(): Observable<OwnerProfile> {
    return this.http.get<OwnerProfile>(`${this.base}/me`);
  }

  properties(): Observable<OwnerProperty[]> {
    return this.http.get<OwnerProperty[]>(`${this.base}/properties`);
  }

  property(id: number): Observable<OwnerProperty> {
    return this.http.get<OwnerProperty>(`${this.base}/properties/${id}`);
  }

  createProperty(request: OwnerPropertyRequest): Observable<OwnerProperty> {
    return this.http.post<OwnerProperty>(`${this.base}/properties`, request);
  }

  updateProperty(id: number, request: OwnerPropertyRequest): Observable<OwnerProperty> {
    return this.http.put<OwnerProperty>(`${this.base}/properties/${id}`, request);
  }

  saveAnnonce(propertyId: number, request: OwnerListingRequest): Observable<OwnerAnnonce> {
    return this.http.put<OwnerAnnonce>(`${this.base}/properties/${propertyId}/annonce`, request);
  }

  addPhotos(propertyId: number, files: File[]): Observable<OwnerPhoto[]> {
    const form = new FormData();
    files.forEach(f => form.append('files', f, f.name));
    return this.http.post<OwnerPhoto[]>(`${this.base}/properties/${propertyId}/annonce/photos`, form);
  }

  deletePhoto(propertyId: number, mediaId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/properties/${propertyId}/annonce/photos/${mediaId}`);
  }

  /** Photo chargée avec le jeton (une balise img ne peut pas l'envoyer). */
  photoBlobUrl(propertyId: number, mediaId: number): Observable<string> {
    return this.http
      .get(`${this.base}/properties/${propertyId}/annonce/photos/${mediaId}/content`, { responseType: 'blob' })
      .pipe(map(blob => URL.createObjectURL(blob)));
  }

  publish(propertyId: number): Observable<OwnerAnnonce> {
    return this.http.post<OwnerAnnonce>(`${this.base}/properties/${propertyId}/annonce/publish`, {});
  }

  withdraw(propertyId: number): Observable<OwnerAnnonce> {
    return this.http.post<OwnerAnnonce>(`${this.base}/properties/${propertyId}/annonce/withdraw`, {});
  }

  leads(): Observable<OwnerLead[]> {
    return this.http.get<OwnerLead[]>(`${this.base}/leads`);
  }

  changeLeadStatus(id: number, statusCode: string): Observable<OwnerLead> {
    return this.http.put<OwnerLead>(`${this.base}/leads/${id}/status`, { statusCode });
  }

  // ── Échanges avec le prospect (UC-P4) ──
  conversation(leadId: number): Observable<OwnerConversation> {
    return this.http.get<OwnerConversation>(`${this.base}/leads/${leadId}/conversation`);
  }

  sendMessage(leadId: number, body: string): Observable<OwnerConversation> {
    return this.http.post<OwnerConversation>(`${this.base}/leads/${leadId}/messages`, { body });
  }

  proposeVisits(leadId: number, slots: SlotRequest[]): Observable<OwnerConversation> {
    return this.http.post<OwnerConversation>(`${this.base}/leads/${leadId}/visit-proposals`, { slots });
  }

  withdrawProposals(leadId: number): Observable<OwnerConversation> {
    return this.http.delete<OwnerConversation>(`${this.base}/leads/${leadId}/visit-proposals`);
  }

  cancelVisit(leadId: number, visitId: number): Observable<OwnerConversation> {
    return this.http.post<OwnerConversation>(`${this.base}/leads/${leadId}/visits/${visitId}/cancel`, {});
  }
}
