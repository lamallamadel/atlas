import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsCardComponent,
  DsEmptyStateComponent,
  DsSkeletonComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import { DossierApiService, DossierResponse } from '../../services/dossier-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

export const B2B_CASE_TYPE = 'CRM_LEAD_B2B_DEMO';

/** Colonnes du pipeline B2B (spec 08_workflow_b2b_demo.md). Les actions viennent du serveur, dans le détail. */
export const B2B_COLUMNS: readonly { code: string; label: string }[] = [
  { code: 'B2B_NEW', label: 'Nouvelles demandes' },
  { code: 'B2B_QUALIFIED', label: 'Qualifiées' },
  { code: 'B2B_SCHEDULED', label: 'Démo planifiée' },
  { code: 'B2B_DONE', label: 'Démo réalisée' },
  { code: 'B2B_WON', label: 'Gagnées' },
  { code: 'B2B_LOST', label: 'Perdues' },
];

/** Profils du formulaire de démo de la vitrine (pages/vitrine/demo). */
const ACTOR_LABELS: Record<string, string> = {
  agence: 'Agence',
  promoteur: 'Promoteur',
  agent: 'Agent indépendant',
  reseau: 'Réseau d\'agences',
  autre: 'Autre',
};

/**
 * Pipeline des demandes de démo reçues par la vitrine : une colonne par statut, une carte par
 * agence intéressée. Ouvrir une carte mène au dossier, où se font les transitions.
 */
@Component({
  selector: 'app-b2b-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DsBadgeComponent, DsCardComponent, DsEmptyStateComponent, DsSkeletonComponent, PageHeaderComponent],
  template: `
    <div class="pro-page ds-form-stack b2b-page">
      <ds-page-header
        eyebrow="Espace Pro"
        titleBefore="Démos B2B"
        description="Demandes de démonstration reçues par la vitrine, de la demande à la signature.">
      </ds-page-header>

      @if (loading()) {
        <ds-skeleton variant="text"></ds-skeleton>
        <ds-skeleton variant="text"></ds-skeleton>
      } @else if (total() === 0) {
        <ds-card [pad]="true" elevation="xs">
          <ds-empty-state
            title="Aucune demande de démo"
            description="Les demandes envoyées depuis le formulaire de démo de la vitrine apparaîtront ici.">
          </ds-empty-state>
        </ds-card>
      } @else {
        <div class="b2b-board" role="list" aria-label="Pipeline des démos">
          @for (col of columns; track col.code) {
            <section class="b2b-col" role="listitem" [attr.aria-label]="col.label">
              <header class="b2b-col__head">
                <span>{{ col.label }}</span>
                <span class="b2b-col__count">{{ byStatus()[col.code]?.length || 0 }}</span>
              </header>
              @for (d of byStatus()[col.code] || []; track d.id) {
                <a class="b2b-card" [routerLink]="['/pro/dossiers', d.id]">
                  <span class="b2b-card__name">{{ d.leadName || 'Sans nom' }}</span>
                  @if (detail(d, 'city') || detail(d, 'actorType')) {
                    <span class="b2b-card__meta">
                      {{ detail(d, 'city') }}@if (detail(d, 'city') && detail(d, 'actorType')) { · }{{ actor(d) }}
                    </span>
                  }
                  @if (needs(d).length) {
                    <span class="b2b-card__tags">
                      @for (n of needs(d); track n) { <ds-badge size="sm" status="neutral" [showDot]="false">{{ n }}</ds-badge> }
                    </span>
                  }
                  <span class="b2b-card__foot">
                    <span>{{ d.assignedTo ? (d.assignedToName || d.assignedTo) : 'À attribuer' }}</span>
                    <span>{{ d.createdAt | date: 'dd/MM' }}</span>
                  </span>
                </a>
              }
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .b2b-page { display: flex; flex-direction: column; gap: var(--ds-space-6); }
    .b2b-board { display: grid; grid-template-columns: repeat(6, minmax(200px, 1fr)); gap: var(--ds-space-3); overflow-x: auto; padding-bottom: var(--ds-space-2); }
    .b2b-col { display: flex; flex-direction: column; gap: var(--ds-space-2); min-width: 200px; background: var(--ds-surface-2); border-radius: var(--ds-radius-lg); padding: var(--ds-space-3); }
    .b2b-col__head { display: flex; justify-content: space-between; font-size: var(--ds-text-sm); font-weight: 700; color: var(--ds-marine); }
    .b2b-col__count { color: var(--ds-text-muted); font-weight: 600; }
    .b2b-card { display: flex; flex-direction: column; gap: 6px; padding: var(--ds-space-3); background: var(--ds-surface); border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); text-decoration: none; color: var(--ds-text); }
    .b2b-card:hover, .b2b-card:focus-visible { border-color: var(--ds-marine); }
    .b2b-card__name { font-weight: 600; font-size: var(--ds-text-sm); }
    .b2b-card__meta { font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .b2b-card__tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .b2b-card__foot { display: flex; justify-content: space-between; font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
  `],
})
export class B2bDemoComponent implements OnInit {
  private readonly api = inject(DossierApiService);
  private readonly toast = inject(DsToastService);

  readonly columns = B2B_COLUMNS;
  readonly dossiers = signal<DossierResponse[]>([]);
  readonly loading = signal(true);
  readonly total = computed(() => this.dossiers().length);
  readonly byStatus = computed(() => {
    const groups: Record<string, DossierResponse[]> = {};
    for (const d of this.dossiers()) {
      const code = d.statusCode || 'B2B_NEW';
      (groups[code] ??= []).push(d);
    }
    return groups;
  });

  ngOnInit(): void {
    this.api.list({ caseType: B2B_CASE_TYPE, size: 500, sort: 'updatedAt,desc' }).subscribe({
      next: page => { this.dossiers.set(page.content); this.loading.set(false); },
      error: err => {
        this.loading.set(false);
        this.toast.error(serverMessage(err, 'Impossible de charger les démos'));
      },
    });
  }

  detail(d: DossierResponse, key: string): string {
    const v = d.leadDetails?.[key];
    return typeof v === 'string' ? v : '';
  }

  actor(d: DossierResponse): string {
    const a = this.detail(d, 'actorType');
    return ACTOR_LABELS[a] ?? a;
  }

  needs(d: DossierResponse): string[] {
    const v = d.leadDetails?.['needs'];
    return Array.isArray(v) ? v.filter((n): n is string => typeof n === 'string').slice(0, 4) : [];
  }
}
