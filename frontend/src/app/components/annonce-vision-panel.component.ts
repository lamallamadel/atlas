import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DsBadgeComponent,
  DsBadgeStatus,
  DsButtonComponent,
  DsCardComponent,
  DsIconComponent,
  DsProgressBarComponent,
  DsTextareaComponent,
  DsToastService,
} from '../design-system';
import {
  AnnonceMedia,
  AnnonceMediaApiService,
  VisionProfile,
  VisionStatusResponse,
} from '../services/annonce-media-api.service';

const ROOM_LABELS: Record<string, string> = {
  salon: 'Salon', salle_a_manger: 'Salle à manger', cuisine: 'Cuisine', chambre: 'Chambre',
  salle_de_bain: 'Salle de bain', toilettes: 'Toilettes', entree: 'Entrée', couloir: 'Couloir',
  bureau: 'Bureau', buanderie: 'Buanderie', dressing: 'Dressing', balcon: 'Balcon',
  terrasse: 'Terrasse', jardin: 'Jardin', piscine: 'Piscine', facade: 'Façade', vue: 'Vue',
  parking: 'Parking', garage: 'Garage', cage_escalier: "Cage d'escalier", autre: 'Autre',
};

const CONDITION_LABELS: Record<string, { label: string; status: DsBadgeStatus }> = {
  neuf: { label: 'Neuf', status: 'success' },
  bon_etat: { label: 'Bon état', status: 'success' },
  a_rafraichir: { label: 'À rafraîchir', status: 'warning' },
  a_renover: { label: 'À rénover', status: 'error' },
};

const MEDIA_STATUS: Record<string, { label: string; status: DsBadgeStatus }> = {
  PENDING: { label: 'En attente', status: 'neutral' },
  DONE: { label: 'Analysée', status: 'success' },
  FAILED: { label: 'Échec', status: 'warning' },
  REJECTED: { label: 'Non analysable', status: 'error' },
};

export const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 100;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function roomLabel(type: string | null | undefined): string {
  return type ? ROOM_LABELS[type] ?? type : '—';
}

export function conditionBadge(condition: string | null | undefined): { label: string; status: DsBadgeStatus } | null {
  return condition ? CONDITION_LABELS[condition] ?? null : null;
}

export function mediaStatusBadge(status: string): { label: string; status: DsBadgeStatus } {
  return MEDIA_STATUS[status] ?? { label: status, status: 'neutral' };
}

/** « ≈ 12–15 m² » : toujours présenté comme une estimation, jamais comme une mesure. */
export function formatArea(min: number | null | undefined, max: number | null | undefined): string | null {
  if (min == null || max == null) {
    return null;
  }
  const r = (n: number) => Math.round(n);
  return r(min) === r(max) ? `≈ ${r(min)} m²` : `≈ ${r(min)}–${r(max)} m²`;
}

export function formatEra(era: VisionProfile['epoque']): string | null {
  if (!era || (era.from_year == null && era.to_year == null)) {
    return null;
  }
  if (era.from_year != null && era.to_year != null) {
    return era.from_year === era.to_year ? `vers ${era.from_year}` : `entre ${era.from_year} et ${era.to_year}`;
  }
  return era.from_year != null ? `après ${era.from_year}` : `avant ${era.to_year}`;
}

/**
 * Photos d'une annonce et lecture de leur contenu par IA : pièces, équipements, matériaux,
 * mobilier, état, époque, surfaces estimées, incohérences et description proposée.
 * Les images ne sont jamais modifiées. La description n'est appliquée que sur action de l'agent.
 */
@Component({
  selector: 'app-annonce-vision-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DsBadgeComponent,
    DsButtonComponent,
    DsCardComponent,
    DsIconComponent,
    DsProgressBarComponent,
    DsTextareaComponent,
  ],
  templateUrl: './annonce-vision-panel.component.html',
  styleUrls: ['./annonce-vision-panel.component.scss'],
})
export class AnnonceVisionPanelComponent implements OnInit {
  readonly annonceId = input.required<number>();
  @Output() descriptionApplied = new EventEmitter<string>();

  private readonly api = inject(AnnonceMediaApiService);
  private readonly toast = inject(DsToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<VisionStatusResponse | null>(null);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly starting = signal(false);
  readonly applying = signal(false);
  readonly thumbnails = signal<Record<number, string>>({});
  descriptionDraft = '';

  readonly media = computed(() => this.state()?.media ?? []);
  readonly result = computed(() => this.state()?.result ?? null);
  readonly profile = computed(() => this.result()?.profile ?? null);
  readonly running = computed(() => this.state()?.status === 'RUNNING');
  readonly progress = computed(() => {
    const s = this.state();
    if (!s || s.total === 0) return 0;
    return Math.round(((s.done + s.failed + s.rejected) / s.total) * 100);
  });
  readonly failures = computed(() => {
    const errors = this.media()
      .filter((m) => m.analysisStatus === 'FAILED' && m.analysisError)
      .map((m) => m.analysisError as string);
    return [...new Set(errors)];
  });
  readonly era = computed(() => formatEra(this.profile()?.epoque ?? null));
  readonly condition = computed(() => conditionBadge(this.profile()?.etat_general));

  readonly roomLabel = roomLabel;
  readonly conditionBadge = conditionBadge;
  readonly mediaStatusBadge = mediaStatusBadge;
  readonly formatArea = formatArea;

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private polls = 0;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.pollTimer) clearTimeout(this.pollTimer);
      Object.values(this.thumbnails()).forEach((u) => URL.revokeObjectURL(u));
    });
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.api.status(this.annonceId()).subscribe({
      next: (s) => this.applyState(s),
      error: () => {
        this.loading.set(false);
        this.toast.error("Impossible de charger les photos de l'annonce");
      },
    });
  }

  private applyState(s: VisionStatusResponse): void {
    const previousDescription = this.state()?.result?.descriptions?.['fr'];
    this.state.set(s);
    this.loading.set(false);
    const fr = s.result?.descriptions?.['fr'];
    if (fr && fr !== previousDescription) {
      this.descriptionDraft = fr;
    }
    this.loadThumbnails(s.media);
    if (s.status === 'RUNNING') {
      this.schedulePoll();
    } else {
      this.polls = 0;
    }
  }

  private schedulePoll(): void {
    if (this.pollTimer || this.polls >= MAX_POLLS) return;
    this.pollTimer = setTimeout(() => {
      this.pollTimer = null;
      this.polls++;
      this.refresh();
    }, POLL_INTERVAL_MS);
  }

  private loadThumbnails(media: AnnonceMedia[]): void {
    for (const m of media) {
      if (m.source !== 'UPLOAD' || this.thumbnails()[m.id]) continue;
      this.api.content(m.url).subscribe({
        next: (blob) => this.thumbnails.update((t) => ({ ...t, [m.id]: URL.createObjectURL(blob) })),
        error: () => undefined,
      });
    }
  }

  imageSrc(m: AnnonceMedia): string | null {
    return m.source === 'UPLOAD' ? this.thumbnails()[m.id] ?? null : m.url;
  }

  onFilesSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const files = Array.from(inputEl.files ?? []);
    inputEl.value = '';
    if (!files.length) return;
    const refused = files.filter((f) => !ACCEPTED_TYPES.includes(f.type));
    if (refused.length) {
      this.toast.warning(`Formats acceptés : JPEG, PNG, WebP (${refused.length} fichier(s) ignoré(s))`);
    }
    const accepted = files.filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (!accepted.length) return;
    this.uploading.set(true);
    this.api.upload(this.annonceId(), accepted).subscribe({
      next: (created) => {
        this.uploading.set(false);
        this.toast.success(`${created.length} photo(s) importée(s)`);
        this.refresh();
      },
      error: (err) => {
        this.uploading.set(false);
        this.toast.error(err?.error?.detail || "L'import des photos a échoué");
      },
    });
  }

  deleteMedia(m: AnnonceMedia): void {
    this.api.delete(this.annonceId(), m.id).subscribe({
      next: () => {
        const url = this.thumbnails()[m.id];
        if (url) URL.revokeObjectURL(url);
        this.refresh();
      },
      error: () => this.toast.error('Suppression impossible'),
    });
  }

  analyze(force = false): void {
    this.starting.set(true);
    this.api.analyze(this.annonceId(), force).subscribe({
      next: (s) => {
        this.starting.set(false);
        this.applyState(s);
      },
      error: (err) => {
        this.starting.set(false);
        this.toast.error(err?.error?.detail || "Impossible de lancer l'analyse");
      },
    });
  }

  applyDescription(): void {
    const text = this.descriptionDraft.trim();
    if (!text) return;
    this.applying.set(true);
    this.api.applyDescription(this.annonceId(), text).subscribe({
      next: () => {
        this.applying.set(false);
        this.toast.success("Description de l'annonce mise à jour");
        this.descriptionApplied.emit(text);
      },
      error: () => {
        this.applying.set(false);
        this.toast.error('La description n’a pas pu être enregistrée');
      },
    });
  }
}
