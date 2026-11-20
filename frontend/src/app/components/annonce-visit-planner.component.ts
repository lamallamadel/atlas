import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  DsButtonComponent,
  DsInputComponent,
  DsSelectComponent,
  DsSelectOption,
  DsToastService,
} from '../design-system';
import {
  AnnonceBuyerMatchesApiService,
  BuyerMatch,
  VisitPlanResult,
} from '../services/annonce-buyer-matches-api.service';
import { apiErrorMessage } from './annonce-pitch-composer.component';

export const DURATION_OPTIONS: DsSelectOption[] = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 h' },
  { value: 90, label: '1 h 30' },
];

/** « 2026-11-21T10:00:00 » → « 2026-11-21T10:00 » (valeur d'un champ datetime-local). */
export function toLocalInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : '';
}

/** Ajoute des minutes à une date locale sans passer par les fuseaux horaires. */
export function addMinutesLocal(local: string, minutes: number): string {
  const [d, t] = local.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, da, h, mi + minutes));
  return dt.toISOString().slice(0, 16);
}

/** Prochaine heure pleine, à défaut de créneau proposé. */
export function defaultStart(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 2, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

/**
 * Planification de la visite demandée par l'acheteur : prérempli avec le créneau libre proposé,
 * modifiable. Crée un rendez-vous dans l'agenda (les rappels habituels s'appliquent).
 */
@Component({
  selector: 'app-annonce-visit-planner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsButtonComponent, DsInputComponent, DsSelectComponent],
  template: `
    <section class="vp" data-testid="visit-planner" aria-label="Planifier la visite">
      <div class="vp__fields">
        <ds-input type="datetime-local" label="Début de la visite" [ngModel]="start()" (ngModelChange)="start.set($event)"
                  name="visit-start" [error]="startError()"></ds-input>
        <ds-select label="Durée" [options]="durations" [ngModel]="duration()" (ngModelChange)="duration.set(+$event)"
                   name="visit-duration"></ds-select>
      </div>
      @if (match().proposedStart && start() === proposed) {
        <p class="vp__hint">Créneau libre dans votre agenda, choisi dans les disponibilités du client.</p>
      }
      <div class="vp__actions">
        <ds-button variant="ghost" size="sm" (dsClick)="closed.emit()">Annuler</ds-button>
        <ds-button variant="marine" size="sm" prefixIcon="calendar" [loading]="saving()" [disabled]="!canSave()"
                   (dsClick)="save()" data-testid="visit-save">Créer le rendez-vous</ds-button>
      </div>
    </section>
  `,
  styles: [
    `
      .vp {
        display: flex; flex-direction: column; gap: var(--ds-space-2);
        margin-top: var(--ds-space-2); padding: var(--ds-space-3);
        border: 1px solid var(--ds-marine); border-radius: var(--ds-radius-md); background: var(--ds-surface-2);
      }
      .vp__fields { display: flex; flex-wrap: wrap; gap: var(--ds-space-3); }
      .vp__fields > * { flex: 1 1 180px; }
      .vp__hint { margin: 0; font-size: 12px; color: var(--ds-text-muted); }
      .vp__actions { display: flex; justify-content: flex-end; gap: var(--ds-space-2); }
    `,
  ],
})
export class AnnonceVisitPlannerComponent implements OnInit {
  readonly annonceId = input.required<number>();
  readonly match = input.required<BuyerMatch>();
  readonly planned = output<VisitPlanResult>();
  readonly closed = output<void>();

  private readonly api = inject(AnnonceBuyerMatchesApiService);
  private readonly toast = inject(DsToastService);

  readonly durations = DURATION_OPTIONS;
  readonly start = signal('');
  readonly duration = signal(45);
  readonly saving = signal(false);
  proposed = '';

  readonly startError = computed(() => {
    const s = this.start();
    if (!s) return 'Choisissez une date et une heure';
    return s < defaultStart(new Date(Date.now() - 2 * 3600_000)) ? 'Cette date est passée' : null;
  });
  readonly canSave = computed(() => !this.startError() && !this.saving());

  ngOnInit(): void {
    const m = this.match();
    this.proposed = toLocalInput(m.proposedStart);
    this.start.set(this.proposed || defaultStart());
    if (m.proposedStart && m.proposedEnd) {
      const minutes = Math.round((Date.parse(m.proposedEnd) - Date.parse(m.proposedStart)) / 60000);
      if (minutes > 0) this.duration.set(minutes);
    }
  }

  save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    const startTime = `${this.start()}:00`;
    const endTime = `${addMinutesLocal(this.start(), this.duration())}:00`;
    this.api.planVisit(this.annonceId(), this.match().id, { startTime, endTime }).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.toast.success('Visite planifiée');
        for (const w of r.warnings ?? []) this.toast.info(w);
        this.planned.emit(r);
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.toast.error(apiErrorMessage(e, "Le rendez-vous n'a pas pu être créé"));
      },
    });
  }
}
