import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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

  submitDemoRequest(data: DemoFormData): Observable<{ success: boolean }> {
    console.log('[VitrineService] Demo request submitted:', data);
    // Mock: simulate API call with 800ms delay
    return of({ success: true }).pipe(delay(800));
  }

  submitContactRequest(data: ContactFormData): Observable<{ success: boolean }> {
    console.log('[VitrineService] Contact request submitted:', data);
    return of({ success: true }).pipe(delay(600));
  }
}
