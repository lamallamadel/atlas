import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DsBadgeComponent, DsBadgeStatus, DsCardComponent, DsIconComponent } from '../design-system';
import { AnnonceResponse } from '../services/annonce-api.service';

/** Résultats d'analyse IA d'une annonce (sous-ensemble de AnnonceResponse). */
export type AnnonceAiFields = Pick<
  AnnonceResponse,
  | 'aiScore'
  | 'fraudScore'
  | 'fraudStatut'
  | 'fraudAlertes'
  | 'duplicateOfId'
  | 'duplicateSimilarity'
  | 'duplicateStatut'
>;

export interface AiBadge {
  kind: 'fraud' | 'duplicate';
  status: DsBadgeStatus;
  label: string;
  tooltip: string;
}

const FRAUD_LABELS: Record<string, { status: DsBadgeStatus; label: string }> = {
  SAIN: { status: 'success', label: 'Aucune anomalie' },
  SUSPECT: { status: 'warning', label: 'Suspecte' },
  FRAUDULEUX: { status: 'error', label: 'Fraude probable' },
};

const DUPLICATE_LABELS: Record<string, { status: DsBadgeStatus; label: string }> = {
  DOUBLON_PROBABLE: { status: 'warning', label: 'Doublon probable' },
  DOUBLON_CERTAIN: { status: 'error', label: 'Doublon' },
};

/**
 * Badges d'alerte à afficher sur une carte ou une ligne de liste.
 * Une annonce saine ou pas encore analysée n'a aucun badge : on ne signale que les risques.
 */
export function computeAiAlertBadges(a: AnnonceAiFields): AiBadge[] {
  const badges: AiBadge[] = [];

  const fraud = a.fraudStatut ? FRAUD_LABELS[a.fraudStatut] : undefined;
  if (fraud && a.fraudStatut !== 'SAIN') {
    const alertes = a.fraudAlertes?.length ? a.fraudAlertes.join(' · ') : 'Analyse de fraude';
    badges.push({
      kind: 'fraud',
      status: fraud.status,
      label: fraud.label,
      tooltip: `Risque de fraude ${a.fraudScore ?? '?'}/100 — ${alertes}`,
    });
  }

  const duplicate = a.duplicateStatut ? DUPLICATE_LABELS[a.duplicateStatut] : undefined;
  if (duplicate && a.duplicateOfId != null) {
    const similarity = a.duplicateSimilarity != null ? ` (${Math.round(a.duplicateSimilarity)} % similaire)` : '';
    badges.push({
      kind: 'duplicate',
      status: duplicate.status,
      label: duplicate.label,
      tooltip: `Ressemble à l'annonce #${a.duplicateOfId}${similarity}`,
    });
  }

  return badges;
}

export function fraudBadge(a: AnnonceAiFields): { status: DsBadgeStatus; label: string } | null {
  return a.fraudStatut ? FRAUD_LABELS[a.fraudStatut] ?? null : null;
}

export function duplicateBadge(a: AnnonceAiFields): { status: DsBadgeStatus; label: string } | null {
  return a.duplicateStatut ? DUPLICATE_LABELS[a.duplicateStatut] ?? null : null;
}

/**
 * Affiche les résultats d'analyse IA du brain pour une annonce.
 *  - mode `compact` (cartes, tableau) : uniquement les badges de risque (fraude, doublon)
 *  - mode détaillé (fiche annonce) : carte « Analyse IA » avec score, alertes et lien vers le doublon
 */
@Component({
  selector: 'app-annonce-ai-badges',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, RouterLink, DsBadgeComponent, DsCardComponent, DsIconComponent],
  template: `
    @if (compact()) {
      @if (alertBadges().length) {
        <span class="ai-badges" data-testid="annonce-ai-badges">
          @for (b of alertBadges(); track b.kind) {
            <ds-badge
              [status]="b.status"
              size="sm"
              [showDot]="false"
              [ariaLabel]="b.tooltip"
              [attr.title]="b.tooltip">
              <ds-icon [name]="b.kind === 'fraud' ? 'alert-circle' : 'copy'" [size]="12"></ds-icon>
              {{ b.label }}
            </ds-badge>
          }
        </span>
      }
    } @else {
      <ds-card elevation="xs" class="ai-card" data-testid="annonce-ai-analysis">
        <h2 class="ai-card__title">
          <ds-icon name="sparkle" [size]="16"></ds-icon>
          Analyse IA
        </h2>

        @if (!analysed()) {
          <p class="ai-card__empty">Analyse en attente : les résultats apparaissent quelques secondes après l'enregistrement.</p>
        } @else {
          <dl class="ai-card__grid">
            @if (isSet(annonce().aiScore)) {
              <div class="ai-card__item">
                <dt>Score qualité</dt>
                <dd><strong>{{ annonce().aiScore }}</strong>/100</dd>
              </div>
            }

            @if (fraud(); as f) {
              <div class="ai-card__item" data-testid="ai-fraud">
                <dt>Fraude</dt>
                <dd>
                  <ds-badge [status]="f.status" size="sm" [showDot]="false">{{ f.label }}</ds-badge>
                  @if (isSet(annonce().fraudScore)) {
                    <span class="ai-card__muted">risque {{ annonce().fraudScore }}/100</span>
                  }
                  @if (annonce().fraudAlertes?.length) {
                    <ul class="ai-card__alertes">
                      @for (alerte of annonce().fraudAlertes; track alerte) {
                        <li>{{ alerte }}</li>
                      }
                    </ul>
                  }
                </dd>
              </div>
            }

            <div class="ai-card__item" data-testid="ai-duplicate">
              <dt>Doublon</dt>
              <dd>
                @if (duplicate(); as d) {
                  <ds-badge [status]="d.status" size="sm" [showDot]="false">{{ d.label }}</ds-badge>
                  <a class="ai-card__link" [routerLink]="['/pro/annonces', annonce().duplicateOfId]">
                    Voir l'annonce #{{ annonce().duplicateOfId }}
                  </a>
                  @if (isSet(annonce().duplicateSimilarity)) {
                    <span class="ai-card__muted">{{ annonce().duplicateSimilarity | number:'1.0-0' }} % similaire</span>
                  }
                } @else {
                  <span class="ai-card__muted">Aucun doublon détecté</span>
                }
              </dd>
            </div>
          </dl>
        }
      </ds-card>
    }
  `,
  styles: [`
    :host { display: contents; }
    .ai-badges { display: inline-flex; flex-wrap: wrap; gap: var(--ds-space-1); }
    .ai-badges ds-icon { margin-right: 4px; }

    .ai-card { display: block; margin-top: var(--ds-space-4); }
    .ai-card__title {
      display: flex; align-items: center; gap: var(--ds-space-2);
      margin: 0 0 var(--ds-space-3);
      font-size: 15px; font-weight: 700; color: var(--ds-text);
    }
    .ai-card__empty { margin: 0; font-size: 13px; color: var(--ds-text-muted); }
    .ai-card__grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--ds-space-4); margin: 0;
    }
    .ai-card__item dt {
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--ds-text-faint); margin-bottom: var(--ds-space-1);
    }
    .ai-card__item dd {
      margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-2);
      font-size: 14px; color: var(--ds-text);
    }
    .ai-card__muted { font-size: 13px; color: var(--ds-text-muted); }
    .ai-card__alertes {
      flex-basis: 100%; margin: var(--ds-space-1) 0 0; padding-left: var(--ds-space-4);
      font-size: 13px; color: var(--ds-text-muted);
    }
    .ai-card__link { font-size: 13px; font-weight: 600; color: var(--ds-marine); }
    .ai-card__link:hover { color: var(--ds-marine-hover); }
  `],
})
export class AnnonceAiBadgesComponent {
  readonly annonce = input.required<AnnonceAiFields>();
  readonly compact = input(false);

  readonly alertBadges = computed(() => computeAiAlertBadges(this.annonce()));
  readonly fraud = computed(() => fraudBadge(this.annonce()));
  readonly duplicate = computed(() => duplicateBadge(this.annonce()));
  isSet(value: unknown): boolean {
    return value !== null && value !== undefined;
  }

  readonly analysed = computed(() => {
    const a = this.annonce();
    return a.aiScore != null || a.fraudStatut != null || a.duplicateStatut != null;
  });
}
