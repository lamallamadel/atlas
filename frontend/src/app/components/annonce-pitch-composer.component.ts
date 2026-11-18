import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  DsButtonComponent,
  DsIconComponent,
  DsRadioGroupComponent,
  DsRadioOption,
  DsSkeletonComponent,
  DsTextareaComponent,
  DsToastService,
} from '../design-system';
import {
  AnnonceBuyerMatchesApiService,
  BuyerMatch,
  PitchChannel,
  PitchDraft,
  PitchLanguage,
  PitchSendResult,
} from '../services/annonce-buyer-matches-api.service';

export const LANGUAGE_OPTIONS: DsRadioOption[] = [
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'Darija' },
  { value: 'en', label: 'English' },
];
export const CHANNEL_OPTIONS: DsRadioOption[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
];

export function engineLabel(engine: string): string {
  return engine === 'modele' ? 'modèle de texte, sans IA' : `IA (${engine})`;
}

/** Message d'erreur lisible renvoyé par l'API (champ detail du problem+json). */
export function apiErrorMessage(e: HttpErrorResponse | null | undefined, fallback: string): string {
  const detail = e?.error?.detail;
  return typeof detail === 'string' && detail && detail !== 'An unexpected error occurred' ? detail : fallback;
}

/**
 * Proposition d'un bien à un acheteur : brouillon rédigé par l'IA, que l'agent relit et modifie
 * avant de l'envoyer par WhatsApp ou SMS. Rien ne part sans clic sur « Envoyer ».
 */
@Component({
  selector: 'app-annonce-pitch-composer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsButtonComponent, DsIconComponent, DsRadioGroupComponent, DsSkeletonComponent, DsTextareaComponent],
  templateUrl: './annonce-pitch-composer.component.html',
  styleUrls: ['./annonce-pitch-composer.component.scss'],
})
export class AnnoncePitchComposerComponent implements OnInit {
  readonly annonceId = input.required<number>();
  readonly match = input.required<BuyerMatch>();
  readonly sent = output<PitchSendResult>();
  readonly closed = output<void>();

  private readonly api = inject(AnnonceBuyerMatchesApiService);
  private readonly toast = inject(DsToastService);

  readonly languageOptions = LANGUAGE_OPTIONS;
  readonly channelOptions = CHANNEL_OPTIONS;
  readonly engineLabel = engineLabel;

  language: PitchLanguage = 'fr';
  channel: PitchChannel = 'WHATSAPP';
  readonly message = signal('');
  readonly draft = signal<PitchDraft | null>(null);
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly loadError = signal(false);

  readonly length = computed(() => this.message().trim().length);
  readonly tooLong = computed(() => {
    const d = this.draft();
    return !!d && this.message().length > d.maxLength;
  });
  readonly canSend = computed(() => {
    const d = this.draft();
    return !!d && !d.blockers.length && this.length() > 0 && !this.tooLong() && !this.sending();
  });
  /** WhatsApp bloqué par la règle des 24 h : proposer de passer en SMS. */
  readonly suggestSms = computed(() => {
    const d = this.draft();
    return !!d && d.channel === 'WHATSAPP' && d.whatsappWindowOpen === false;
  });

  ngOnInit(): void {
    const previous = this.match().pitchChannel;
    if (previous) this.channel = previous;
    this.loadDraft();
  }

  loadDraft(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.draftPitch(this.annonceId(), this.match().id, this.language, this.channel).subscribe({
      next: (d) => {
        this.draft.set(d);
        this.message.set(d.message);
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.loadError.set(true);
        this.toast.error(apiErrorMessage(e, 'La rédaction du message a échoué'));
      },
    });
  }

  onOptionsChange(): void {
    this.loadDraft();
  }

  switchToSms(): void {
    this.channel = 'SMS';
    this.loadDraft();
  }

  send(): void {
    if (!this.canSend()) return;
    this.sending.set(true);
    this.api
      .sendPitch(this.annonceId(), this.match().id, {
        message: this.message().trim(),
        channel: this.channel,
        language: this.language,
      })
      .subscribe({
        next: (r) => {
          this.sending.set(false);
          this.toast.success(`Proposition envoyée par ${r.channel === 'SMS' ? 'SMS' : 'WhatsApp'}`);
          this.sent.emit(r);
        },
        error: (e: HttpErrorResponse) => {
          this.sending.set(false);
          this.toast.error(apiErrorMessage(e, "L'envoi a échoué"));
        },
      });
  }
}
