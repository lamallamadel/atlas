import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
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
  PitchPhoto,
  PitchSendResult,
} from '../services/annonce-buyer-matches-api.service';
import { AnnonceMediaApiService } from '../services/annonce-media-api.service';
import { roomLabel } from './annonce-vision-panel.component';

/** WhatsApp : photos envoyées après le texte, une par message. */
export const MAX_PITCH_PHOTOS = 3;

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
export class AnnoncePitchComposerComponent implements OnInit, OnDestroy {
  readonly annonceId = input.required<number>();
  readonly match = input.required<BuyerMatch>();
  readonly sent = output<PitchSendResult>();
  readonly closed = output<void>();

  private readonly api = inject(AnnonceBuyerMatchesApiService);
  private readonly toast = inject(DsToastService);
  private readonly mediaApi = inject(AnnonceMediaApiService);

  readonly languageOptions = LANGUAGE_OPTIONS;
  readonly channelOptions = CHANNEL_OPTIONS;
  readonly engineLabel = engineLabel;
  readonly roomLabel = roomLabel;
  readonly maxPhotos = MAX_PITCH_PHOTOS;

  /** Photos cochées, dans l'ordre d'envoi. */
  readonly selectedPhotos = signal<number[]>([]);
  /** Vignettes des photos importées (URL locales créées à partir du contenu protégé). */
  readonly thumbnails = signal<Record<number, string>>({});

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
        const photos = d.photos ?? [];
        this.selectedPhotos.set(photos.filter((p) => p.suggested).map((p) => p.mediaId).slice(0, MAX_PITCH_PHOTOS));
        this.loadThumbnails(photos);
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
        mediaIds: this.channel === 'WHATSAPP' ? this.selectedPhotos() : [],
      })
      .subscribe({
        next: (r) => {
          this.sending.set(false);
          const photos = r.photosQueued ? ` avec ${r.photosQueued} photo(s)` : '';
          this.toast.success(`Proposition envoyée par ${r.channel === 'SMS' ? 'SMS' : 'WhatsApp'}${photos}`);
          this.sent.emit(r);
        },
        error: (e: HttpErrorResponse) => {
          this.sending.set(false);
          this.toast.error(apiErrorMessage(e, "L'envoi a échoué"));
        },
      });
  }

  isSelected(p: PitchPhoto): boolean {
    return this.selectedPhotos().includes(p.mediaId);
  }

  /** Coche ou décoche une photo ; au-delà de la limite, la case reste désactivée. */
  togglePhoto(p: PitchPhoto): void {
    this.selectedPhotos.update((ids) => {
      if (ids.includes(p.mediaId)) return ids.filter((id) => id !== p.mediaId);
      return ids.length >= MAX_PITCH_PHOTOS ? ids : [...ids, p.mediaId];
    });
  }

  photoSrc(p: PitchPhoto): string | null {
    return p.source === 'UPLOAD' ? this.thumbnails()[p.mediaId] ?? null : p.url;
  }

  private loadThumbnails(photos: PitchPhoto[]): void {
    for (const p of photos) {
      if (p.source !== 'UPLOAD' || this.thumbnails()[p.mediaId]) continue;
      this.mediaApi.content(p.url).subscribe({
        next: (blob) => this.thumbnails.update((t) => ({ ...t, [p.mediaId]: URL.createObjectURL(blob) })),
        error: () => undefined,
      });
    }
  }

  ngOnDestroy(): void {
    for (const url of Object.values(this.thumbnails())) URL.revokeObjectURL(url);
  }
}
