import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ConsentLinkApiService, PublicConsentView } from '../../../services/consent-link-api.service';
import { DsButtonComponent, DsCardComponent, DsIconComponent, DsSkeletonComponent } from '../../../design-system';

/** Page publique où le client confirme (ou refuse) lui-même son consentement. */
@Component({
  selector: 'app-consentement',
  standalone: true,
  imports: [DsButtonComponent, DsCardComponent, DsIconComponent, DsSkeletonComponent],
  templateUrl: './consentement.component.html',
  styleUrls: ['./consentement.component.css'],
})
export class ConsentementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ConsentLinkApiService);

  readonly view = signal<PublicConsentView | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly sending = signal<'ACCEPT' | 'REFUSE' | null>(null);
  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.api.view(this.token).subscribe({
      next: (v) => { this.view.set(v); this.loading.set(false); },
      error: (e: HttpErrorResponse) => { this.error.set(this.message(e)); this.loading.set(false); },
    });
  }

  answer(decision: 'ACCEPT' | 'REFUSE'): void {
    if (this.sending()) return;
    this.sending.set(decision);
    this.api.answer(this.token, decision).subscribe({
      next: (v) => { this.view.set(v); this.sending.set(null); },
      error: (e: HttpErrorResponse) => { this.error.set(this.message(e)); this.sending.set(null); },
    });
  }

  channelLabel(channel: string | undefined): string {
    switch (channel) {
      case 'WHATSAPP': return 'WhatsApp';
      case 'SMS': return 'SMS';
      case 'EMAIL': return 'e-mail';
      default: return channel || '';
    }
  }

  purposeText(v: PublicConsentView): string {
    return v.consentType === 'MARKETING'
      ? 'vous envoyer des propositions de biens immobiliers qui correspondent à votre recherche'
      : 'vous écrire au sujet de votre dossier (réponses, visites, documents)';
  }

  private message(e: HttpErrorResponse): string {
    const detail = e?.error?.detail;
    if (typeof detail === 'string' && detail && detail !== 'An unexpected error occurred') return detail;
    return e?.status === 404 ? "Ce lien n'existe pas ou n'est plus valable." : 'Une erreur est survenue. Réessayez dans un instant.';
  }
}
