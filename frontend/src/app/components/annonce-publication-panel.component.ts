import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsProgressBarComponent,
  DsSelectComponent,
  DsSkeletonComponent,
  DsToastService,
} from '../design-system';
import type { DsBadgeStatus, DsProgressBarVariant, DsSelectOption } from '../design-system';
import {
  AnnonceApiService,
  AnnoncePublication,
  AnnonceSuspendReason,
  AnnonceTransitionOption,
} from '../services/annonce-api.service';
import { AuthService } from '../services/auth.service';

export const SUSPEND_REASON_LABELS: Record<AnnonceSuspendReason, string> = {
  OWNER_PAUSE: "Pause demandée par l'agence ou le propriétaire",
  MOD_SUSPECT_FRAUD: 'Suspicion de fraude',
  MOD_ILLEGAL_CONTENT: 'Contenu non conforme',
  MOD_DUPLICATE_LISTING: 'Doublon',
  MOD_OTHER: 'Autre raison',
};

/** Couleur de la jauge de qualité. */
export function qualityVariant(score: number): DsProgressBarVariant {
  return score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error';
}

/** Message d'erreur du serveur (« CODE: message ») sans le code. */
export function serverMessage(err: unknown, fallback: string): string {
  const detail = (err as HttpErrorResponse)?.error?.detail;
  if (typeof detail === 'string' && detail.includes(':')) {
    return detail.substring(detail.indexOf(':') + 1).trim();
  }
  return typeof detail === 'string' && detail ? detail : fallback;
}

/**
 * Publication de l'annonce : score de qualité, ce qui manque, signaux de doublon ou de fraude,
 * et les actions possibles (publier, suspendre, archiver) telles que le serveur les autorise.
 */
@Component({
  selector: 'app-annonce-publication-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DsBadgeComponent,
    DsButtonComponent,
    DsCardComponent,
    DsProgressBarComponent,
    DsSelectComponent,
    DsSkeletonComponent,
  ],
  template: `
    <ds-card elevation="xs" class="pub-card">
      <div class="pub-head">
        <h2 class="pub-title">Publication</h2>
        @if (publication(); as p) {
          <ds-badge [status]="statusBadge(p.status)" size="sm">{{ statusText(p.status) }}</ds-badge>
        }
      </div>

      @if (loading()) {
        <ds-skeleton variant="text" width="60%" height="16px"></ds-skeleton>
        <ds-skeleton variant="text" width="90%" height="12px" style="margin-top:8px"></ds-skeleton>
      } @else if (publication(); as p) {
        <div class="pub-quality">
          <div class="pub-quality__row">
            <span>Qualité de l'annonce</span>
            <strong>{{ p.quality.score }}/100</strong>
          </div>
          <ds-progress-bar [value]="p.quality.score" [variant]="qualityVariant(p.quality.score)"></ds-progress-bar>
          <p class="pub-muted">{{ p.quality.photoCount }} photo(s) sur {{ p.quality.minPhotos }} demandées</p>
          @if (p.quality.missing.length) {
            <ul class="pub-missing">
              @for (m of p.quality.missing; track m.code) {
                <li [class.pub-missing--blocking]="m.blocking">
                  {{ m.label }}@if (m.blocking) { <span class="pub-tag">obligatoire</span> }
                </li>
              }
            </ul>
          }
        </div>

        @if (p.trust.blocking) {
          <div class="pub-alert" role="alert">
            @if (p.trust.duplicateStatut === 'DOUBLON_CERTAIN') {
              <p>Doublon certain de l'annonce n°{{ p.trust.duplicateOfId }}.</p>
            }
            @if (p.trust.fraudStatut === 'FRAUDULEUX') {
              <p>L'analyse juge cette annonce frauduleuse.</p>
            }
            @if (p.trust.override) {
              <p class="pub-muted">Publication validée par {{ p.trust.override.by || 'un manager' }} : « {{ p.trust.override.reason }} »</p>
            } @else if (isManager) {
              <label class="pub-label" for="pub-override">Valider malgré tout (raison obligatoire)</label>
              <textarea id="pub-override" class="pub-textarea" rows="2" [(ngModel)]="overrideReason"
                placeholder="Ex. même bien, deux mandats distincts"></textarea>
              <ds-button variant="ghost" size="sm" [disabled]="!overrideReason.trim() || busy()" (dsClick)="override()">
                Autoriser la publication
              </ds-button>
            } @else {
              <p class="pub-muted">Un manager doit valider la publication.</p>
            }
          </div>
        }

        @if (p.suspension) {
          <p class="pub-muted">Suspendue : {{ suspendLabel(p.suspension.reasonCode) }}
            @if (p.suspension.comment) { — {{ p.suspension.comment }} }</p>
        }

        @if (suspending()) {
          <div class="pub-suspend">
            <ds-select label="Raison de la suspension" [options]="suspendOptions" [(ngModel)]="suspendReason"></ds-select>
            <textarea class="pub-textarea" rows="2" [(ngModel)]="suspendComment" placeholder="Commentaire (facultatif)"></textarea>
            <div class="pub-actions">
              <ds-button variant="ghost" size="sm" (dsClick)="suspending.set(false)">Annuler</ds-button>
              <ds-button variant="danger" size="sm" [disabled]="!suspendReason || busy()" (dsClick)="apply(suspendOption()!)">Suspendre</ds-button>
            </div>
          </div>
        } @else {
          <div class="pub-actions">
            @for (t of p.transitions; track t.code) {
              <ds-button
                [variant]="t.code === 'ANN_T_PUBLISH' ? 'marine' : t.code === 'ANN_T_SUSPEND' ? 'ghost' : 'ghost'"
                size="sm"
                [disabled]="!t.allowed || busy()"
                [loading]="busy() && pending() === t.code"
                (dsClick)="start(t)">
                {{ t.label }}
              </ds-button>
            }
          </div>
          @if (publishBlockers().length) {
            <p class="pub-muted">Pour publier : {{ publishBlockers().join(' · ') }}</p>
          }
        }
      }
    </ds-card>
  `,
  styles: [`
    .pub-card { display: block; margin-top: var(--ds-space-4); }
    .pub-head { display: flex; align-items: center; justify-content: space-between; gap: var(--ds-space-3); margin-bottom: var(--ds-space-3); }
    .pub-title { font-size: var(--ds-text-base); font-weight: 600; margin: 0; }
    .pub-quality__row { display: flex; justify-content: space-between; font-size: var(--ds-text-sm); margin-bottom: var(--ds-space-2); }
    .pub-muted { font-size: var(--ds-text-xs); color: var(--ds-text-muted); margin: var(--ds-space-2) 0 0; }
    .pub-missing { margin: var(--ds-space-2) 0 0; padding-left: var(--ds-space-5); font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .pub-missing--blocking { color: var(--ds-text); }
    .pub-tag { margin-left: var(--ds-space-2); font-size: var(--ds-text-xs); color: var(--ds-error); }
    .pub-alert { margin-top: var(--ds-space-3); padding: var(--ds-space-3); border: 1px solid var(--ds-error); border-radius: var(--ds-radius-md); background: var(--ds-error-hl); font-size: var(--ds-text-sm); }
    .pub-alert p { margin: 0 0 var(--ds-space-2); }
    .pub-label { display: block; font-size: var(--ds-text-xs); margin: var(--ds-space-2) 0 var(--ds-space-1); }
    .pub-textarea { width: 100%; box-sizing: border-box; margin: var(--ds-space-2) 0; padding: var(--ds-space-2); border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); font: inherit; font-size: var(--ds-text-sm); background: var(--ds-surface); color: var(--ds-text); }
    .pub-actions { display: flex; flex-wrap: wrap; gap: var(--ds-space-2); margin-top: var(--ds-space-3); }
    .pub-suspend { margin-top: var(--ds-space-3); }
  `],
})
export class AnnoncePublicationPanelComponent implements OnInit {
  readonly annonceId = input.required<number>();
  /** Émis après un changement de statut, pour recharger l'annonce. */
  readonly changed = output<void>();

  private readonly api = inject(AnnonceApiService);
  private readonly toast = inject(DsToastService);
  private readonly auth = inject(AuthService);

  readonly publication = signal<AnnoncePublication | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly pending = signal<string | null>(null);
  readonly suspending = signal(false);

  readonly qualityVariant = qualityVariant;
  readonly isManager = this.auth.hasRole('ADMIN') || this.auth.hasRole('MANAGER');

  readonly suspendOptions: DsSelectOption[] = (Object.keys(SUSPEND_REASON_LABELS) as AnnonceSuspendReason[])
    .map(value => ({ value, label: SUSPEND_REASON_LABELS[value] }));
  suspendReason: AnnonceSuspendReason | '' = '';
  suspendComment = '';
  overrideReason = '';

  readonly suspendOption = computed(() =>
    this.publication()?.transitions.find(t => t.code === 'ANN_T_SUSPEND') ?? null);

  readonly publishBlockers = computed(() =>
    this.publication()?.transitions.find(t => t.code === 'ANN_T_PUBLISH')?.blockers.map(b => b.message) ?? []);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getPublication(this.annonceId()).subscribe({
      next: p => { this.publication.set(p); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Impossible de charger la publication'); },
    });
  }

  start(t: AnnonceTransitionOption): void {
    if (t.requiresReason) {
      this.suspendReason = '';
      this.suspendComment = '';
      this.suspending.set(true);
      return;
    }
    this.apply(t);
  }

  apply(t: AnnonceTransitionOption): void {
    const reason = t.requiresReason ? (this.suspendReason || null) : null;
    this.busy.set(true);
    this.pending.set(t.code);
    this.api.applyTransition(this.annonceId(), t.code, reason, t.requiresReason ? this.suspendComment : null)
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.pending.set(null);
          this.suspending.set(false);
          this.toast.success(t.code === 'ANN_T_PUBLISH' ? 'Annonce publiée sur le portail'
            : t.code === 'ANN_T_SUSPEND' ? 'Annonce suspendue' : 'Annonce archivée');
          this.load();
          this.changed.emit();
        },
        error: err => {
          this.busy.set(false);
          this.pending.set(null);
          this.toast.error(serverMessage(err, "L'opération a échoué"));
          this.load();
        },
      });
  }

  override(): void {
    this.busy.set(true);
    this.api.overrideTrust(this.annonceId(), this.overrideReason.trim()).subscribe({
      next: p => {
        this.busy.set(false);
        this.overrideReason = '';
        this.publication.set(p);
        this.toast.success('Publication autorisée');
      },
      error: err => {
        this.busy.set(false);
        this.toast.error(serverMessage(err, "L'opération a échoué"));
      },
    });
  }

  statusText(status: string): string {
    return { DRAFT: 'Brouillon', PUBLISHED: 'En ligne', SUSPENDED: 'Suspendue', ARCHIVED: 'Archivée' }[status] ?? status;
  }

  statusBadge(status: string): DsBadgeStatus {
    return status === 'PUBLISHED' ? 'active' : status === 'SUSPENDED' ? 'paused'
      : status === 'ARCHIVED' ? 'archived' : 'draft';
  }

  suspendLabel(code: AnnonceSuspendReason): string {
    return SUSPEND_REASON_LABELS[code] ?? code;
  }
}
