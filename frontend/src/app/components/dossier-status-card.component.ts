import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  DossierApiService,
  DossierResponse,
  DossierTransitionOption,
  DossierTransitions,
} from '../services/dossier-api.service';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsSelectComponent,
  DsToastService,
} from '../design-system';
import type { DsSelectOption } from '../design-system';
import { serverMessage } from './annonce-publication-panel.component';

/**
 * Message lisible pour un changement de statut refusé : la consigne du serveur (raison manquante,
 * rendez-vous à planifier, rôle insuffisant) plutôt que le détail technique.
 */
export function transitionErrorMessage(err: unknown): string {
  const props = (err as HttpErrorResponse)?.error?.properties;
  const errors = props?.validationErrors ?? {};
  const required: unknown = errors.requiredFieldsActionableMessages;
  if (Array.isArray(required) && required.length) return String(required[0]);
  if (typeof errors.roleAuthorizationError === 'string') {
    return 'Cette étape est réservée à un manager.';
  }
  if (typeof errors.actionableMessage === 'string') return errors.actionableMessage;
  return serverMessage(err, 'Le statut n\'a pas pu être changé');
}

/**
 * Statut du dossier et étapes suivantes (ADR 0004) : les actions viennent du workflow du type de
 * dossier, telles que le serveur les autorise. Une perte demande sa raison avant d'être envoyée.
 */
@Component({
  selector: 'app-dossier-status-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsBadgeComponent, DsButtonComponent, DsCardComponent, DsSelectComponent],
  template: `
    <ds-card [pad]="true" elevation="xs">
      <h3 class="st-title">Statut</h3>
      @if (state(); as s) {
        <ds-badge class="st-current" [status]="badge(s.stage)">{{ s.statusLabel }}</ds-badge>

        @if (pending(); as p) {
          <div class="st-reason">
            <ds-select
              [label]="'Raison — ' + p.label"
              placeholder="Choisir une raison"
              [options]="reasonOptions(p)"
              [(ngModel)]="reason"
              [disabled]="busy()">
            </ds-select>
            <div class="st-reason__actions">
              <ds-button size="sm" variant="ghost" [disabled]="busy()" (dsClick)="cancel()">Annuler</ds-button>
              <ds-button size="sm" [variant]="p.stage === 'LOST' ? 'danger' : 'marine'"
                [disabled]="busy() || !reason" (dsClick)="confirm(p)">Confirmer</ds-button>
            </div>
          </div>
        } @else if (s.transitions.length) {
          <div class="st-actions">
            @for (t of s.transitions; track t.statusCode) {
              <ds-button size="sm" [variant]="variant(t)" [disabled]="busy()" (dsClick)="choose(t)">
                {{ t.label }}
              </ds-button>
              @if (t.requires.includes('appointment')) {
                <span class="st-hint">Nécessite un rendez-vous planifié</span>
              }
            }
          </div>
        } @else {
          <p class="st-final">Dossier clôturé.</p>
        }
      } @else if (failed()) {
        <p class="st-final">Statut indisponible.</p>
      }
    </ds-card>
  `,
  styles: [`
    .st-title { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: var(--ds-marine); }
    .st-current { display: inline-block; margin-bottom: 12px; }
    .st-actions { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
    .st-hint { margin-top: -4px; font-size: 12px; color: var(--ds-text-muted); }
    .st-reason { display: flex; flex-direction: column; gap: 8px; }
    .st-reason__actions { display: flex; justify-content: flex-end; gap: 8px; }
    .st-final { margin: 0; font-size: 13px; color: var(--ds-text-muted); }
  `],
})
export class DossierStatusCardComponent {
  readonly dossier = input.required<DossierResponse>();
  /** Émis avec le dossier à jour après un changement de statut. */
  readonly changed = output<DossierResponse>();

  private readonly api = inject(DossierApiService);
  private readonly toast = inject(DsToastService);

  readonly state = signal<DossierTransitions | null>(null);
  readonly failed = signal(false);
  readonly busy = signal(false);
  /** Transition en attente de sa raison. */
  readonly pending = signal<DossierTransitionOption | null>(null);
  reason = '';

  /** Recharge les transitions quand le dossier ou son statut change. */
  private readonly key = computed(() => `${this.dossier().id}:${this.dossier().statusCode ?? this.dossier().status}`);

  constructor() {
    effect(() => {
      this.key();
      this.load();
    });
  }

  badge(stage: string | null): 'success' | 'error' | 'active' {
    return stage === 'WON' ? 'success' : stage === 'LOST' ? 'error' : 'active';
  }

  variant(t: DossierTransitionOption): 'danger' | 'ghost' | 'marine' {
    if (t.stage === 'LOST') return 'danger';
    return t.stage === 'WON' ? 'marine' : 'ghost';
  }

  reasonOptions(t: DossierTransitionOption): DsSelectOption[] {
    return t.reasons.map(r => ({ value: r.code, label: r.label }));
  }

  choose(t: DossierTransitionOption): void {
    if (this.needsReason(t)) {
      this.reason = '';
      this.pending.set(t);
      return;
    }
    this.send(t, {});
  }

  confirm(t: DossierTransitionOption): void {
    const extra = t.requires.includes('lossReason') ? { lossReason: this.reason } : { wonReason: this.reason };
    this.send(t, extra);
  }

  cancel(): void {
    this.pending.set(null);
    this.reason = '';
  }

  private needsReason(t: DossierTransitionOption): boolean {
    return (t.requires.includes('lossReason') || t.requires.includes('wonReason')) && t.reasons.length > 0;
  }

  private send(t: DossierTransitionOption, extra: { lossReason?: string; wonReason?: string }): void {
    this.busy.set(true);
    this.api.changeStatus(this.dossier().id, { statusCode: t.statusCode, ...extra }).subscribe({
      next: d => {
        this.busy.set(false);
        this.pending.set(null);
        this.toast.success(`Statut : ${t.label}`);
        this.changed.emit(d);
      },
      error: err => {
        this.busy.set(false);
        this.toast.error(transitionErrorMessage(err));
      },
    });
  }

  private load(): void {
    const id = this.dossier().id;
    this.api.transitions(id).subscribe({
      next: s => { this.state.set(s); this.failed.set(false); },
      error: () => { this.state.set(null); this.failed.set(true); },
    });
  }
}
