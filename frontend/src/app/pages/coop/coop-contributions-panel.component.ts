import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsEmptyStateComponent,
  DsInputComponent,
  DsSelectComponent,
  DsToastService,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import {
  CONTRIBUTION_STATUS_LABELS,
  CONTRIBUTION_TYPE_LABELS,
  CoopApiService,
  CoopContribution,
  CoopContributionType,
  CoopMember,
  formatMoney,
  toRequest,
} from '../../services/coop-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

/** Échéance dépassée et non payée : en retard, même si personne ne l'a encore marquée. */
export function isLate(c: CoopContribution, today = new Date().toISOString().slice(0, 10)): boolean {
  return c.status === 'OVERDUE' || (c.status === 'PENDING' && !!c.dueDate && c.dueDate < today);
}

/** Journal des cotisations du groupement (déclaratif : justificatifs, pas de paiement intégré). */
@Component({
  selector: 'app-coop-contributions-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsBadgeComponent, DsButtonComponent, DsEmptyStateComponent, DsInputComponent, DsSelectComponent],
  template: `
    <div class="cp-summary">
      <div class="cp-stat"><span class="cp-stat__label">Appelé</span><span class="cp-stat__value">{{ money(totals().called) }}</span></div>
      <div class="cp-stat"><span class="cp-stat__label">Payé</span><span class="cp-stat__value">{{ money(totals().paid) }}</span></div>
      <div class="cp-stat"><span class="cp-stat__label">À payer</span><span class="cp-stat__value">{{ money(totals().due) }}</span></div>
      <div class="cp-stat"><span class="cp-stat__label">En retard</span><span class="cp-stat__value">{{ money(totals().late) }}</span></div>
    </div>

    @if (canEdit() && members().length) {
      <form #f="ngForm" class="cp-form" (ngSubmit)="add(f)">
        <ds-select label="Membre" name="memberId" [options]="memberOptions()" [(ngModel)]="draft.memberId" required></ds-select>
        <ds-select label="Type" name="type" [options]="typeOptions" [(ngModel)]="draft.type" required></ds-select>
        <ds-input label="Montant (MAD)" type="number" name="amount" [(ngModel)]="draft.amount" required></ds-input>
        <ds-input label="Échéance" type="date" name="dueDate" [(ngModel)]="draft.dueDate"></ds-input>
        <div class="cp-form__submit">
          <ds-button variant="marine" nativeType="submit" [disabled]="busy() || !!f.invalid || !(+draft.amount > 0)">Appeler</ds-button>
        </div>
      </form>
    }

    @if (loading()) {
      <p class="cp-muted">Chargement…</p>
    } @else if (contributions().length === 0) {
      <ds-empty-state [compact]="true" title="Aucune cotisation"
        description="Les appels de fonds et versements des membres apparaîtront ici."></ds-empty-state>
    } @else {
      <table class="cp-table" aria-label="Cotisations du groupement">
        <thead><tr><th scope="col">Membre</th><th scope="col">Type</th><th scope="col" class="cp-right">Montant</th><th scope="col">Échéance</th><th scope="col">Statut</th>
          @if (canEdit()) { <th scope="col"><span class="cp-muted">Action</span></th> }</tr></thead>
        <tbody>
          @for (c of contributions(); track c.id) {
            <tr>
              <td>{{ memberName(c.memberId) }}</td>
              <td>{{ typeLabels[c.type] }}</td>
              <td class="cp-right">{{ money(c.amount, c.currency) }}</td>
              <td>{{ c.dueDate || '—' }}@if (c.paymentDate) { <span class="cp-muted">payée le {{ c.paymentDate }}</span> }</td>
              <td>
                <ds-badge size="sm" [status]="c.status === 'PAID' ? 'success' : late(c) ? 'error' : c.status === 'CANCELLED' ? 'neutral' : 'warning'">
                  {{ late(c) && c.status === 'PENDING' ? 'En retard' : statusLabels[c.status] }}
                </ds-badge>
              </td>
              @if (canEdit()) {
                <td>
                  @if (c.status === 'PENDING' || c.status === 'OVERDUE') {
                    <ds-button size="sm" variant="ghost" [disabled]="busy()" (dsClick)="markPaid(c)">Marquer payée</ds-button>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    }
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
  readonly typeOptions: DsSelectOption[] = (Object.keys(CONTRIBUTION_TYPE_LABELS) as CoopContributionType[])
    .map(t => ({ value: t, label: CONTRIBUTION_TYPE_LABELS[t] }));
  readonly memberOptions = computed<DsSelectOption[]>(() =>
    this.members().map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName}` })));

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

  draft: { memberId: number | null; type: CoopContributionType; amount: number | string; dueDate: string } = this.empty();

  ngOnInit(): void {
    this.load();
  }

  money(v: number, currency?: string | null): string {
    return formatMoney(v, currency);
  }

  late(c: CoopContribution): boolean {
    return isLate(c);
  }

  memberName(id: number): string {
    const m = this.members().find(x => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : `Membre #${id}`;
  }

  add(form: NgForm): void {
    const amount = Number(this.draft.amount);
    if (form.invalid || !this.draft.memberId || !(amount > 0)) return;
    this.busy.set(true);
    this.api.createContribution({
      memberId: this.draft.memberId,
      type: this.draft.type,
      amount,
      currency: 'MAD',
      status: 'PENDING',
      dueDate: this.draft.dueDate || null,
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success('Appel de fonds enregistré');
        form.resetForm();
        this.draft = this.empty();
        this.load();
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, "L'enregistrement a échoué")); },
    });
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

  private empty() {
    return { memberId: null as number | null, type: 'INITIAL' as CoopContributionType, amount: '' as number | string, dueDate: '' };
  }
}
