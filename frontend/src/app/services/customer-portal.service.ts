import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  CustomerPortalDossier,
  ClientSecureMessage,
  ClientAppointmentRequest,
  ClientSatisfactionSurvey,
  ConsentPreference,
  WhiteLabelBranding,
  PropertyRecommendation
} from '../models/customer-portal.models';

@Injectable({
  providedIn: 'root'
})
export class CustomerPortalService {
  private readonly baseUrl = '/api/customer-portal';
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private orgIdSubject = new BehaviorSubject<string | null>(null);
  private dossierIdSubject = new BehaviorSubject<number | null>(null);

  token$ = this.tokenSubject.asObservable();
  orgId$ = this.orgIdSubject.asObservable();
  dossierId$ = this.dossierIdSubject.asObservable();

  constructor(private http: HttpClient) {
    const storedToken = localStorage.getItem('customerPortalToken');
    const storedOrgId = localStorage.getItem('customerPortalOrgId');
    const storedDossierId = localStorage.getItem('customerPortalDossierId');
    
    if (storedToken) this.tokenSubject.next(storedToken);
    if (storedOrgId) this.orgIdSubject.next(storedOrgId);
    if (storedDossierId) this.dossierIdSubject.next(parseInt(storedDossierId, 10));
  }

  validateToken(token: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/validate`, { token }).pipe(
      tap((response: any) => {
        if (response.valid) {
          this.tokenSubject.next(response.token);
          this.orgIdSubject.next(response.orgId);
          this.dossierIdSubject.next(response.dossierId);
          
          localStorage.setItem('customerPortalToken', response.token);
          localStorage.setItem('customerPortalOrgId', response.orgId);
          localStorage.setItem('customerPortalDossierId', response.dossierId.toString());
        }
      })
    );
  }

  getDossier(dossierId: number): Observable<CustomerPortalDossier> {
    return this.http.get<CustomerPortalDossier>(`${this.baseUrl}/dossier/${dossierId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getMessages(dossierId: number): Observable<ClientSecureMessage[]> {
    return this.http.get<ClientSecureMessage[]>(`${this.baseUrl}/messages/${dossierId}`, {
      headers: this.getAuthHeaders()
    });
  }

  sendMessage(dossierId: number, encryptedContent: string, iv: string): Observable<ClientSecureMessage> {
    return this.http.post<ClientSecureMessage>(
      `${this.baseUrl}/messages/${dossierId}`,
      { encryptedContent, iv },
      { headers: this.getAuthHeaders() }
    );
  }

  markMessageAsRead(messageId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/messages/${messageId}/read`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getAppointmentRequests(dossierId: number): Observable<ClientAppointmentRequest[]> {
    return this.http.get<ClientAppointmentRequest[]>(`${this.baseUrl}/appointments/${dossierId}`, {
      headers: this.getAuthHeaders()
    });
  }

  createAppointmentRequest(dossierId: number, request: ClientAppointmentRequest): Observable<ClientAppointmentRequest> {
    return this.http.post<ClientAppointmentRequest>(
      `${this.baseUrl}/appointments/${dossierId}`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  getSurveys(dossierId: number): Observable<ClientSatisfactionSurvey[]> {
    return this.http.get<ClientSatisfactionSurvey[]>(`${this.baseUrl}/surveys/${dossierId}`, {
      headers: this.getAuthHeaders()
    });
  }

  submitSurvey(dossierId: number, survey: ClientSatisfactionSurvey): Observable<ClientSatisfactionSurvey> {
    return this.http.post<ClientSatisfactionSurvey>(
      `${this.baseUrl}/surveys/${dossierId}`,
      survey,
      { headers: this.getAuthHeaders() }
    );
  }

  getConsents(dossierId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/consents/${dossierId}`, {
      headers: this.getAuthHeaders()
    });
  }

  updateConsent(consentId: number, status: string): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/consents/${consentId}`,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }

  getBranding(orgId: string): Observable<WhiteLabelBranding> {
    return this.http.get<WhiteLabelBranding>(`${this.baseUrl}/branding/${orgId}`);
  }

  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/${documentId}/download`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  getPropertyRecommendations(dossierId: number): Observable<PropertyRecommendation[]> {
    return this.http.get<PropertyRecommendation[]>(`${this.baseUrl}/recommendations/${dossierId}`, {
      headers: this.getAuthHeaders()
    });
  }

  logout(): void {
    this.tokenSubject.next(null);
    this.orgIdSubject.next(null);
    this.dossierIdSubject.next(null);
    localStorage.removeItem('customerPortalToken');
    localStorage.removeItem('customerPortalOrgId');
    localStorage.removeItem('customerPortalDossierId');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  get currentToken(): string | null {
    return this.tokenSubject.value;
  }

  get currentOrgId(): string | null {
    return this.orgIdSubject.value;
  }

  get currentDossierId(): number | null {
    return this.dossierIdSubject.value;
  }
}
