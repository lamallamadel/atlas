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
  CoopApiService,
  CoopLot,
  CoopLotStatus,
  CoopMember,
  CoopProject,
  CoopProjectStatus,
  LOT_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  formatMoney,
  toRequest,
} from '../../services/coop-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

const FREE = '__free__';

/** Projets du groupement, leurs lots et l'attribution des lots aux membres. */
@Component({
  selector: 'app-coop-projects-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsBadgeComponent, DsButtonComponent, DsEmptyStateComponent, DsInputComponent, DsSelectComponent],
  template: `
    @if (canEdit()) {
      <form #pf="ngForm" class="cp-form" (ngSubmit)="addProject(pf)">
        <ds-input label="Nouveau projet" name="name" [(ngModel)]="projectDraft.name" required></ds-input>
        <ds-input label="Ville" name="city" [(ngModel)]="projectDraft.city"></ds-input>
        <ds-input label="Budget (MAD)" type="number" name="budget" [(ngModel)]="projectDraft.budget"></ds-input>
        <div class="cp-form__submit">
          <ds-button variant="marine" nativeType="submit" [disabled]="busy() || !!pf.invalid">Créer le projet</ds-button>
        </div>
      </form>
    }

    @if (projects().length === 0) {
      <ds-empty-state [compact]="true" title="Aucun projet" description="Les projets du groupement et leurs lots apparaîtront ici."></ds-empty-state>
    }

    @for (p of projects(); track p.id) {
      <section class="cp-project" [attr.aria-label]="p.name">
        <div class="cp-project__head">
          <div>
            <h3 class="cp-section-title">{{ p.name }}</h3>
            <span class="cp-muted">{{ p.city || '' }}@if (p.totalBudget) { · budget {{ money(p.totalBudget, p.currency) }} } · {{ lotsOf(p.id).length }} lot(s), {{ assignedCount(p.id) }} attribué(s)</span>
          </div>
          @if (canEdit()) {
            <ds-select [ariaLabelSelect]="'Statut du projet ' + p.name" [options]="projectStatusOptions"
              [ngModel]="p.status" (ngModelChange)="setProjectStatus(p, $event)" [disabled]="busy()"></ds-select>
          } @else {
            <ds-badge size="sm" status="info">{{ projectLabels[p.status] }}</ds-badge>
          }
        </div>

        @if (lotsOf(p.id).length) {
          <table class="cp-table" [attr.aria-label]="'Lots de ' + p.name">
            <thead><tr><th scope="col">Lot</th><th scope="col">Surface</th><th scope="col" class="cp-right">Prix</th><th scope="col">Membre</th><th scope="col">Statut</th></tr></thead>
            <tbody>
              @for (l of lotsOf(p.id); track l.id) {
                <tr>
                  <td class="cp-strong">{{ l.lotNumber }}</td>
                  <td>{{ l.surfaceArea ? l.surfaceArea + ' m²' : '—' }}</td>
                  <td class="cp-right">{{ money(l.price ?? null, l.currency) }}</td>
                  <td>
                    @if (canEdit()) {
                      <ds-select [ariaLabelSelect]="'Membre du lot ' + l.lotNumber" [options]="memberOptions()"
                        [ngModel]="l.memberId ?? free" (ngModelChange)="assign(l, $event)" [disabled]="busy()"></ds-select>
                    } @else {
                      {{ memberName(l.memberId) }}
                    }
                  </td>
                  <td><ds-badge size="sm" [status]="l.status === 'AVAILABLE' ? 'active' : 'neutral'">{{ lotLabels[l.status] }}</ds-badge></td>
                </tr>
              }
            </tbody>
          </table>
        }

        @if (canEdit()) {
          <form #lf="ngForm" class="cp-form" (ngSubmit)="addLot(p, lf)">
            <ds-input label="N° de lot" [name]="'lot-' + p.id" [(ngModel)]="lotDrafts[p.id].lotNumber" required></ds-input>
            <ds-input label="Surface (m²)" type="number" [name]="'surface-' + p.id" [(ngModel)]="lotDrafts[p.id].surface"></ds-input>
            <ds-input label="Prix (MAD)" type="number" [name]="'price-' + p.id" [(ngModel)]="lotDrafts[p.id].price"></ds-input>
            <div class="cp-form__submit">
              <ds-button variant="ghost" nativeType="submit" [disabled]="busy() || !!lf.invalid">Ajouter le lot</ds-button>
            </div>
          </form>
        }
      </section>
    }
  `,
  styleUrls: ['./coop-panel.scss'],
})
export class CoopProjectsPanelComponent implements OnInit {
  readonly groupId = input.required<number>();
  readonly members = input.required<CoopMember[]>();
  readonly canEdit = input(false);

  private readonly api = inject(CoopApiService);
  private readonly toast = inject(DsToastService);

  readonly free = FREE;
  readonly projects = signal<CoopProject[]>([]);
  readonly lots = signal<Record<number, CoopLot[]>>({});
  readonly busy = signal(false);
  readonly projectLabels = PROJECT_STATUS_LABELS;
  readonly lotLabels = LOT_STATUS_LABELS;
  readonly projectStatusOptions: DsSelectOption[] = (Object.keys(PROJECT_STATUS_LABELS) as CoopProjectStatus[])
    .map(s => ({ value: s, label: PROJECT_STATUS_LABELS[s] }));
  readonly memberOptions = computed<DsSelectOption[]>(() => [
    { value: FREE, label: 'Non attribué' },
    ...this.members().map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName}` })),
  ]);

  projectDraft = { name: '', city: '', budget: '' as number | string };
  lotDrafts: Record<number, { lotNumber: string; surface: number | string; price: number | string }> = {};

  ngOnInit(): void {
    this.api.projects(this.groupId()).subscribe({
      next: list => {
        this.projects.set(list);
        list.forEach(p => { this.ensureDraft(p.id); this.loadLots(p.id); });
      },
      error: err => this.toast.error(serverMessage(err, 'Impossible de charger les projets')),
    });
  }

  money(v: number | null, currency?: string | null): string {
    return formatMoney(v, currency);
  }

  lotsOf(projectId: number): CoopLot[] {
    return this.lots()[projectId] ?? [];
  }

  assignedCount(projectId: number): number {
    return this.lotsOf(projectId).filter(l => l.memberId != null).length;
  }

  memberName(id: number | null | undefined): string {
    if (id == null) return 'Non attribué';
    const m = this.members().find(x => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : `Membre #${id}`;
  }

  addProject(form: NgForm): void {
    if (form.invalid) return;
    const budget = Number(this.projectDraft.budget);
    this.busy.set(true);
    this.api.createProject({
      groupId: this.groupId(),
      name: this.projectDraft.name.trim(),
      city: this.projectDraft.city || null,
      status: 'PLANNING',
      totalBudget: budget > 0 ? budget : null,
      currency: 'MAD',
    }).subscribe({
      next: p => {
        this.busy.set(false);
        this.ensureDraft(p.id);
        this.projects.update(list => [...list, p]);
        this.lots.update(map => ({ ...map, [p.id]: [] }));
        this.toast.success(`Projet « ${p.name} » créé`);
        form.resetForm();
        this.projectDraft = { name: '', city: '', budget: '' };
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'La création a échoué')); },
    });
  }

  setProjectStatus(p: CoopProject, status: CoopProjectStatus): void {
    if (p.status === status) return;
    this.busy.set(true);
    this.api.updateProject(p.id, { ...toRequest(p), status }).subscribe({
      next: updated => {
        this.busy.set(false);
        this.projects.update(list => list.map(x => (x.id === p.id ? updated : x)));
        this.toast.success(`Projet : ${PROJECT_STATUS_LABELS[status]}`);
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Le changement a échoué')); },
    });
  }

  addLot(p: CoopProject, form: NgForm): void {
    const d = this.lotDrafts[p.id];
    if (form.invalid || !d) return;
    const surface = Number(d.surface);
    const price = Number(d.price);
    this.busy.set(true);
    this.api.createLot({
      projectId: p.id,
      lotNumber: d.lotNumber.trim(),
      surfaceArea: surface > 0 ? surface : null,
      price: price > 0 ? price : null,
      currency: 'MAD',
      status: 'AVAILABLE',
    }).subscribe({
      next: lot => {
        this.busy.set(false);
        this.lots.update(map => ({ ...map, [p.id]: [...(map[p.id] ?? []), lot] }));
        this.toast.success(`Lot ${lot.lotNumber} ajouté`);
        form.resetForm();
        this.lotDrafts[p.id] = { lotNumber: '', surface: '', price: '' };
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, "L'ajout a échoué")); },
    });
  }

  /** Attribuer un lot le réserve ; le libérer le rend disponible. Un lot livré garde son statut. */
  assign(lot: CoopLot, value: number | string): void {
    const memberId = value === FREE ? null : Number(value);
    if ((lot.memberId ?? null) === memberId) return;
    const status: CoopLotStatus = lot.status === 'SOLD' ? 'SOLD' : memberId == null ? 'AVAILABLE' : 'RESERVED';
    this.busy.set(true);
    this.api.updateLot(lot.id, { ...toRequest(lot), memberId, status }).subscribe({
      next: updated => {
        this.busy.set(false);
        this.lots.update(map => ({
          ...map,
          [lot.projectId]: (map[lot.projectId] ?? []).map(x => (x.id === lot.id ? updated : x)),
        }));
        this.toast.success(memberId == null ? `Lot ${lot.lotNumber} libéré` : `Lot ${lot.lotNumber} attribué à ${this.memberName(memberId)}`);
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, "L'attribution a échoué")); },
    });
  }

  private ensureDraft(projectId: number): void {
    this.lotDrafts[projectId] ??= { lotNumber: '', surface: '', price: '' };
  }

  private loadLots(projectId: number): void {
    this.api.lots(projectId).subscribe({
      next: list => this.lots.update(map => ({ ...map, [projectId]: list })),
      error: () => this.lots.update(map => ({ ...map, [projectId]: [] })),
    });
  }
}
