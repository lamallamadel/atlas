import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  DsBadgeComponent,
  DsCardComponent,
  DsCellDirective,
  DsTableComponent,
  PageHeaderComponent,
} from '../../design-system';
import type { DsColumn } from '../../design-system';
import { MarketplaceApiService, MarketplaceLiquidity, ZoneLiquidity, formatDelay } from '../../services/marketplace-api.service';

/**
 * Ouverture zone par zone (super-admin) : une ville s'ouvre aux propriétaires quand assez
 * d'agences vérifiées la couvrent, et l'on suit si elle tient sa promesse (délai jusqu'à la
 * première proposition, demandes sans réponse, demandes confiées).
 */
@Component({
  selector: 'app-marketplace-zones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsBadgeComponent, DsCardComponent, DsCellDirective, DsTableComponent, PageHeaderComponent],
  template: `
    <div class="pro-page ds-form-stack mz-page">
      <ds-page-header eyebrow="Plateforme" titleBefore="Ouverture des" titleAccent="zones"
        [description]="description()"></ds-page-header>

      @if (data(); as d) {
        <div class="mz-kpis" role="list">
          <div class="mz-kpi" role="listitem"><span class="mz-kpi__value">{{ openCount() }}</span><span class="mz-kpi__label">ville{{ openCount() > 1 ? 's' : '' }} ouverte{{ openCount() > 1 ? 's' : '' }}</span></div>
          <div class="mz-kpi" role="listitem"><span class="mz-kpi__value">{{ d.zones.length - openCount() }}</span><span class="mz-kpi__label">en préparation</span></div>
          <div class="mz-kpi" role="listitem"><span class="mz-kpi__value" [class.mz-alert]="staleTotal() > 0">{{ staleTotal() }}</span><span class="mz-kpi__label">demande{{ staleTotal() > 1 ? 's' : '' }} sans proposition après {{ d.staleHours }} h</span></div>
        </div>
      }

      <ds-card [pad]="false" elevation="xs">
        <ds-table [columns]="columns" [rows]="data()?.zones ?? []" [loading]="loading()" [loadingRowCount]="5"
          [trackBy]="trackZone" label="Liquidité de la bourse par ville"
          [emptyMessage]="error() ?? 'Aucune zone : ni agence ni demande pour le moment.'">
          <ng-template dsCell="city" let-z><span class="mz-city">{{ z.city }}</span></ng-template>
          <ng-template dsCell="status" let-z>
            <ds-badge size="sm" [status]="z.status === 'OPEN' ? 'success' : 'neutral'">{{ z.status === 'OPEN' ? 'Ouverte' : 'En préparation' }}</ds-badge>
          </ng-template>
          <ng-template dsCell="agencies" let-z>
            <span class="mz-num">{{ z.verifiedAgencies }} / {{ data()?.minVerifiedAgencies }}</span>
            @if (z.pendingAgencies) { <span class="mz-muted"> · {{ z.pendingAgencies }} non vérifiée{{ z.pendingAgencies > 1 ? 's' : '' }}</span> }
          </ng-template>
          <ng-template dsCell="requests" let-z>
            <span class="mz-num">{{ z.requests }}</span>
            @if (z.openRequests) { <span class="mz-muted"> · {{ z.openRequests }} ouverte{{ z.openRequests > 1 ? 's' : '' }}</span> }
          </ng-template>
          <ng-template dsCell="stale" let-z><span class="mz-num" [class.mz-alert]="z.staleRequests > 0">{{ z.staleRequests }}</span></ng-template>
          <ng-template dsCell="delay" let-z><span class="mz-num">{{ delay(z.medianHoursToFirstProposal) }}</span></ng-template>
          <ng-template dsCell="award" let-z><span class="mz-num">{{ z.awardRate == null ? '—' : (z.awardRate * 100).toFixed(0) + ' %' }}</span></ng-template>
        </ds-table>
      </ds-card>
      <p class="mz-note">Critère d'ouverture : au moins {{ data()?.minVerifiedAgencies ?? 3 }} agences vérifiées couvrent la ville. Demandes ouvertes à la bourse sur les {{ data()?.windowDays ?? 90 }} derniers jours ; les demandes adressées à une seule agence ne comptent pas.</p>
    </div>
  `,
  styles: [`
    .mz-page { gap: var(--ds-space-6); }
    .mz-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--ds-space-4); }
    .mz-kpi { display: flex; flex-direction: column; gap: var(--ds-space-1); padding: var(--ds-space-4); border: 1px solid var(--ds-border); border-radius: var(--ds-radius-lg); background: var(--ds-surface); }
    .mz-kpi__value { font-family: var(--ds-font-display); font-size: var(--ds-text-2xl); color: var(--ds-marine); font-variant-numeric: tabular-nums; }
    .mz-kpi__label { font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .mz-city { font-weight: 600; color: var(--ds-text); }
    .mz-num { font-variant-numeric: tabular-nums; color: var(--ds-text); }
    .mz-muted { font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .mz-alert { color: var(--ds-error); font-weight: 700; }
    .mz-note { margin: 0; font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
  `],
})
export class MarketplaceZonesComponent implements OnInit {
  private readonly api = inject(MarketplaceApiService);

  readonly data = signal<MarketplaceLiquidity | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly openCount = computed(() => this.data()?.zones.filter(z => z.status === 'OPEN').length ?? 0);
  readonly staleTotal = computed(() => this.data()?.zones.reduce((n, z) => n + z.staleRequests, 0) ?? 0);
  readonly description = computed(() => {
    const open = this.data()?.zones.filter(z => z.status === 'OPEN').map(z => z.city) ?? [];
    return open.length
      ? `Villes ouvertes aux propriétaires : ${open.join(', ')}. Une ville s'ouvre quand assez d'agences vérifiées la couvrent.`
      : 'Une ville s’ouvre aux propriétaires quand assez d’agences vérifiées la couvrent.';
  });

  readonly columns: DsColumn<ZoneLiquidity>[] = [
    { key: 'city', header: 'Ville' },
    { key: 'status', header: 'Statut', width: '150px' },
    { key: 'agencies', header: 'Agences vérifiées', width: '220px' },
    { key: 'requests', header: 'Demandes', width: '160px' },
    { key: 'stale', header: 'Sans proposition', width: '150px', align: 'right' },
    { key: 'delay', header: '1re proposition (médiane)', width: '200px', align: 'right' },
    { key: 'award', header: 'Confiées', width: '110px', align: 'right' },
  ];
  readonly trackZone = (_: number, z: ZoneLiquidity) => z.city;
  readonly delay = formatDelay;

  ngOnInit(): void {
    this.api.liquidity().subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Indicateurs indisponibles. Réessayez dans un instant.'); },
    });
  }
}
