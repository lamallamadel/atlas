import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ConsentPurpose = 'MARKETING' | 'TRANSACTIONNEL';

export interface ConsentLinkResponse {
  requestId: number;
  url: string;
  channel: string;
  consentType: ConsentPurpose;
  expiresAt: string;
}

export interface PublicConsentView {
  status: 'PENDING' | 'ANSWERED' | 'EXPIRED';
  decision?: 'ACCEPT' | 'REFUSE' | null;
  channel: string;
  consentType: ConsentPurpose;
  clientFirstName?: string | null;
  expiresAt: string;
}

/** Lien de confirmation du consentement (double opt-in) : création côté agent, réponse côté client. */
@Injectable({ providedIn: 'root' })
export class ConsentLinkApiService {
  private http = inject(HttpClient);

  createLink(dossierId: number, channel: string, consentType: ConsentPurpose): Observable<ConsentLinkResponse> {
    return this.http.post<ConsentLinkResponse>(`/api/v1/dossiers/${dossierId}/consent-links`, { channel, consentType });
  }

  view(token: string): Observable<PublicConsentView> {
    return this.http.get<PublicConsentView>(`/api/v1/public/consent/${encodeURIComponent(token)}`);
  }

  answer(token: string, decision: 'ACCEPT' | 'REFUSE'): Observable<PublicConsentView> {
    return this.http.post<PublicConsentView>(`/api/v1/public/consent/${encodeURIComponent(token)}`, { decision });
  }
}
