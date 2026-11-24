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
  consent: boolean;
}

export interface ContactFormData {
  nom: string;
  email: string;
  tel?: string;
  sujet: string;
  message: string;
  consent: boolean;
}

/** Texte de la case à cocher, identique à PublicLeadService.CONSENT_TEXT (preuve côté serveur). */
export const PUBLIC_CONTACT_CONSENT_TEXT =
  "J'accepte d'être recontacté(e) au sujet de ma demande, par téléphone, WhatsApp ou e-mail.";

/** Contrat de POST /api/v1/portal/leads : l'agence et le type de dossier sont décidés par le serveur. */
export interface PublicLeadPayload {
  annonceId?: number | null;
  requestType: 'VISIT' | 'INFO' | 'DEMO' | 'CONTACT';
  name: string;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  consent: boolean;
  /** Demande de démo : profil de l'agence, gardé tel quel sur le dossier (lead_details). */
  demo?: {
    city?: string;
    actorType?: string;
    teamSize?: string;
    listingVolume?: string;
    desiredPlan?: string;
    needs?: string[];
  } | null;
}

/** Message lisible pour une demande publique refusée ou en échec. */
export function publicLeadErrorMessage(err: unknown): string {
  const detail = String((err as { error?: { detail?: string } })?.error?.detail ?? '');
  if (detail.startsWith('CONSENT_REQUIRED')) {
    return 'Cochez la case pour accepter d\'être recontacté(e).';
  }
  if (detail.startsWith('CONTACT_REQUIRED')) {
    return 'Indiquez un téléphone ou une adresse e-mail.';
  }
  if (detail.startsWith('ANNONCE_NOT_FOUND')) {
    return 'Cette annonce n\'est plus disponible.';
  }
  return 'Votre demande n\'a pas pu être envoyée. Réessayez dans un instant.';
}

@Injectable({ providedIn: 'root' })
export class VitrineService {

  constructor(private http: HttpClient) {}

  submitDemoRequest(data: DemoFormData): Observable<{ success: boolean }> {
    const details = [
      `Ville : ${data.ville}`,
      `Profil : ${data.actorType}`,
      `Taille de l'équipe : ${data.teamSize || '—'}`,
      `Volume d'annonces : ${data.listingVolume || '—'}`,
      `Offre souhaitée : ${data.desiredPlan || '—'}`,
      `Besoins : ${data.needs.join(', ') || '—'}`,
      data.message ? `Message : ${data.message}` : ''
    ].filter(Boolean).join('\n');

    return this.submitPublicLead({
      requestType: 'DEMO',
      name: data.nom,
      phone: data.tel,
      email: data.email,
      message: details,
      consent: data.consent,
      demo: {
        city: data.ville || undefined,
        actorType: data.actorType || undefined,
        teamSize: data.teamSize || undefined,
        listingVolume: data.listingVolume || undefined,
        desiredPlan: data.desiredPlan || undefined,
        needs: data.needs,
      },
    });
  }

  submitContactRequest(data: ContactFormData): Observable<{ success: boolean }> {
    return this.submitPublicLead({
      requestType: 'CONTACT',
      name: data.nom,
      phone: data.tel || null,
      email: data.email,
      message: `Sujet : ${data.sujet}\n${data.message}`,
      consent: data.consent
    });
  }

  submitPublicLead(payload: PublicLeadPayload): Observable<{ success: boolean }> {
    return this.http.post<unknown>('/api/v1/portal/leads', payload).pipe(
      map(() => ({ success: true }))
    );
  }
}
