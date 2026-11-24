import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsCellDirective,
  DsDialogService,
  DsTableComponent,
  DsToastService,
  KpiCardComponent,
} from '../../design-system';
import type { DsBadgeStatus, DsColumn } from '../../design-system';
import {
  CONTRIBUTION_STATUS_LABELS,
  CONTRIBUTION_TYPE_LABELS,
  CoopApiService,
  CoopContribution,
  CoopMember,
  formatMoney,
  toRequest,
} from '../../services/coop-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { CoopContributionDialogComponent, CoopContributionDialogData } from './coop-dialogs.component';

/** Échéance dépassée et non payée : en retard, même si personne ne l'a encore marquée. */
export function isLate(c: CoopContribution, today = new Date().toISOString().slice(0, 10)): boolean {
  return c.status === 'OVERDUE' || (c.status === 'PENDING' && !!c.dueDate && c.dueDate < today);
}

/** Journal des cotisations du groupement (déclaratif : justificatifs, pas de paiement intégré). */
@Component({
  selector: 'app-coop-contributions-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DsBadgeComponent, DsButtonComponent, DsCardComponent, DsCellDirective, DsTableComponent, KpiCardComponent],
  template: `
    <div class="cp-kpis">
      <ds-kpi-card label="Appelé" [value]="money(totals().called)" [loading]="loading()"></ds-kpi-card>
      <ds-kpi-card label="Payé" [value]="money(totals().paid)" [loading]="loading()" valueColor="var(--ds-success)"></ds-kpi-card>
      <ds-kpi-card label="À payer" [value]="money(totals().due)" [loading]="loading()"></ds-kpi-card>
      <ds-kpi-card label="En retard" [value]="money(totals().late)" [loading]="loading()"
        [valueColor]="totals().late > 0 ? 'var(--ds-error)' : null"></ds-kpi-card>
    </div>

    <ds-card [pad]="false" elevation="xs">
      <ds-table
        [columns]="columns"
        [rows]="contributions()"
        [loading]="loading()"
        [loadingRowCount]="3"
        [trackBy]="trackContribution"
        label="Cotisations du groupement"
        emptyMessage="Aucune cotisation : les appels de fonds et versements des membres apparaîtront ici.">
        <ng-template dsCell="member" let-c>
          <span class="cp-strong">{{ memberName(c.memberId) }}</span>
        </ng-template>
        <ng-template dsCell="type" let-c>{{ typeLabel(c) }}</ng-template>
        <ng-template dsCell="amount" let-c>
          <span class="cp-amount">{{ money(c.amount, c.currency) }}</span>
        </ng-template>
        <ng-template dsCell="dueDate" let-c>
          {{ c.dueDate ? (c.dueDate | date: 'd MMM y') : '—' }}
          @if (c.paymentDate) { <span class="cp-muted">payée le {{ c.paymentDate | date: 'd MMM y' }}</span> }
        </ng-template>
        <ng-template dsCell="status" let-c>
          <ds-badge size="sm" [status]="badge(c)">{{ statusLabel(c) }}</ds-badge>
        </ng-template>
        <ng-template dsCell="actions" let-c>
          @if (c.status === 'PENDING' || c.status === 'OVERDUE') {
            <ds-button size="sm" variant="ghost" prefixIcon="check" [disabled]="busy()" (dsClick)="markPaid(c)">Marquer payée</ds-button>
          }
        </ng-template>
      </ds-table>
    </ds-card>
  `,
  styleUrls: ['./coop-panel.scss'],
})
export class CoopContributionsPanelComponent implements OnInit {
  readonly groupId = input.required<number>();
  readonly members = input.required<CoopMember[]>();
  readonly canEdit = input(false);

  private readonly api = inject(CoopApiService);
  private readonly toast = inject(DsToastService);

  readonly contributions = signal<CoopContribution[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly statusLabels = CONTRIBUTION_STATUS_LABELS;
  readonly typeLabels = CONTRIBUTION_TYPE_LABELS;
  private readonly dialog = inject(DsDialogService);
  readonly trackContribution = (_: number, c: CoopContribution) => c.id;
  readonly columns: DsColumn<CoopContribution>[] = [
    { key: 'member', header: 'Membre' },
    { key: 'type', header: 'Type', width: '170px' },
    { key: 'amount', header: 'Montant', width: '150px', align: 'right' },
    { key: 'dueDate', header: 'Échéance', width: '170px' },
    { key: 'status', header: 'Statut', width: '130px' },
  ];

  readonly totals = computed(() => {
    let called = 0, paid = 0, due = 0, late = 0;
    for (const c of this.contributions()) {
      if (c.status === 'CANCELLED') continue;
      called += c.amount;
      if (c.status === 'PAID') paid += c.amount;
      else if (isLate(c)) late += c.amount;
      else due += c.amount;
    }
    return { called, paid, due, late };
  });

  ngOnInit(): void {
    if (this.canEdit()) this.columns.push({ key: 'actions', header: '', width: '170px', align: 'right' });
    this.load();
  }

  /** Ouvre la boîte d'appel de fonds (il faut au moins un membre). */
  openAdd(): void {
    const data: CoopContributionDialogData = { members: this.members() };
    this.dialog
      .open<CoopContribution>(CoopContributionDialogComponent, { data, width: '560px' })
      .closed.subscribe(c => { if (c) this.load(); });
  }

  badge(c: CoopContribution): DsBadgeStatus {
    if (c.status === 'PAID') return 'success';
    if (c.status === 'CANCELLED') return 'neutral';
    return isLate(c) ? 'error' : 'warning';
  }

  typeLabel(c: CoopContribution): string {
    return this.typeLabels[c.type] ?? c.type;
  }

  statusLabel(c: CoopContribution): string {
    return isLate(c) && c.status === 'PENDING' ? 'En retard' : this.statusLabels[c.status];
  }

  money(v: number, currency?: string | null): string {
    return formatMoney(v, currency);
  }

  memberName(id: number): string {
    const m = this.members().find(x => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : `Membre #${id}`;
  }

  markPaid(c: CoopContribution): void {
    this.busy.set(true);
    const today = new Date().toISOString().slice(0, 10);
    this.api.updateContribution(c.id, { ...toRequest(c), status: 'PAID', paymentDate: today }).subscribe({
      next: updated => {
        this.busy.set(false);
        this.contributions.update(list => list.map(x => (x.id === c.id ? updated : x)));
        this.toast.success('Cotisation marquée payée');
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'La mise à jour a échoué')); },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.contributions(this.groupId()).subscribe({
      next: list => { this.contributions.set(list); this.loading.set(false); },
      error: err => { this.loading.set(false); this.toast.error(serverMessage(err, 'Impossible de charger les cotisations')); },
    });
  }
}
