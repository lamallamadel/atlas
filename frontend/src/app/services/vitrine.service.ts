import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DemoFormData {
  nom: string;
  email: string;
  tel: string;
  ville: string;
  actorType: string;
  teamSize?: string;
  listingVolume?: string;
  desiredPlan?: string;
  needs: string[];
  message?: string;
}

export interface ContactFormData {
  nom: string;
  email: string;
  tel?: string;
  sujet: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class VitrineService {

  constructor(private http: HttpClient) {}

  submitDemoRequest(data: DemoFormData): Observable<{ success: boolean }> {
    const notes = [
      `[Type: DEMO_REQUEST]`,
      `Email: ${data.email}`,
      `Ville: ${data.ville}`,
      `Actor Type: ${data.actorType}`,
      `Team Size: ${data.teamSize || 'N/A'}`,
      `Volume: ${data.listingVolume || 'N/A'}`,
      `Plan: ${data.desiredPlan || 'N/A'}`,
      `Needs: ${data.needs.join(', ')}`,
      `Message: ${data.message || ''}`
    ].join('\n');

    return this.http.post<any>('/api/v1/portal/leads', {
        leadName: data.nom,
        leadPhone: data.tel,
        leadSource: 'VITRINE',
        notes: notes,
        caseType: 'DEMO'
    }).pipe(
      map(() => ({ success: true }))
    );
  }

  submitContactRequest(data: ContactFormData): Observable<{ success: boolean }> {
    const notes = [
      `[Type: CONTACT_FORM]`,
      `Email: ${data.email}`,
      `Sujet: ${data.sujet}`,
      `Message: ${data.message}`
    ].join('\n');

    return this.http.post<any>('/api/v1/portal/leads', {
        leadName: data.nom,
        leadPhone: data.tel || 'NOT_PROVIDED',
        leadSource: 'VITRINE',
        notes: notes,
        caseType: 'INFO'
    }).pipe(
      map(() => ({ success: true }))
    );
  }
}
