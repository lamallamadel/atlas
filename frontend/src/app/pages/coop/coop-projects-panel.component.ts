import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsCellDirective,
  DsDialogService,
  DsEmptyStateComponent,
  DsSelectComponent,
  DsSkeletonComponent,
  DsTableComponent,
  DsToastService,
} from '../../design-system';
import type { DsBadgeStatus, DsColumn, DsSelectOption } from '../../design-system';
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
import {
  CoopLotDialogComponent,
  CoopLotDialogData,
  CoopProjectDialogComponent,
  CoopProjectDialogData,
} from './coop-dialogs.component';

const LOT_BADGE: Record<CoopLotStatus, DsBadgeStatus> = { AVAILABLE: 'active', RESERVED: 'info', SOLD: 'won' };
const PROJECT_BADGE: Record<CoopProjectStatus, DsBadgeStatus> = {
  PLANNING: 'draft', IN_PROGRESS: 'info', COMPLETED: 'success', ON_HOLD: 'paused', CANCELLED: 'archived',
};

const FREE = '__free__';

/** Projets du groupement, leurs lots et l'attribution des lots aux membres. */
@Component({
  selector: 'app-coop-projects-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DsBadgeComponent,
    DsButtonComponent,
    DsCardComponent,
    DsCellDirective,
    DsEmptyStateComponent,
    DsSelectComponent,
    DsSkeletonComponent,
    DsTableComponent,
  ],
  template: `
    @if (loading()) {
      <ds-card [pad]="true" elevation="xs">
        <ds-skeleton variant="heading" width="40%"></ds-skeleton>
        <ds-skeleton variant="text" width="60%"></ds-skeleton>
      </ds-card>
    } @else if (projects().length === 0) {
      <ds-card [pad]="true" elevation="xs">
        <ds-empty-state
          icon="building"
          title="Aucun projet"
          description="Les projets du groupement et leurs lots apparaîtront ici."
          [ctaLabel]="canEdit() ? 'Créer un projet' : null"
          (ctaClick)="openAdd()">
        </ds-empty-state>
      </ds-card>
    }

    @for (p of projects(); track p.id) {
      <ds-card [pad]="false" elevation="xs">
        <section class="cp-project" [attr.aria-label]="p.name">
          <header class="cp-project__head">
            <div class="cp-project__title">
              <h3 class="cp-project__name">{{ p.name }}</h3>
              <span class="cp-muted">
                {{ p.city || 'Ville non renseignée' }}@if (p.totalBudget) { · budget {{ money(p.totalBudget, p.currency) }} }
                · {{ lotsOf(p.id).length }} lot{{ lotsOf(p.id).length > 1 ? 's' : '' }}, {{ assignedCount(p.id) }} attribué{{ assignedCount(p.id) > 1 ? 's' : '' }}
              </span>
            </div>
            @if (canEdit()) {
              <div class="cp-inline-select">
                <ds-select [ariaLabelSelect]="'Statut du projet ' + p.name" [options]="projectStatusOptions"
                  [ngModel]="p.status" (ngModelChange)="setProjectStatus(p, $event)" [disabled]="busy()"></ds-select>
              </div>
            } @else {
              <ds-badge size="sm" [status]="projectBadge[p.status]">{{ projectLabels[p.status] }}</ds-badge>
            }
          </header>

          <ds-table
            [columns]="lotColumns"
            [rows]="lotsOf(p.id)"
            [trackBy]="trackLot"
            [label]="'Lots de ' + p.name"
            emptyMessage="Aucun lot pour ce projet.">
            <ng-template dsCell="lotNumber" let-l><span class="cp-strong">{{ l.lotNumber }}</span></ng-template>
            <ng-template dsCell="surfaceArea" let-l>{{ l.surfaceArea ? l.surfaceArea + ' m²' : '—' }}</ng-template>
            <ng-template dsCell="price" let-l><span class="cp-amount">{{ money(l.price ?? null, l.currency) }}</span></ng-template>
            <ng-template dsCell="member" let-l>
              @if (canEdit()) {
                <div class="cp-inline-select">
                  <ds-select [ariaLabelSelect]="'Membre du lot ' + l.lotNumber" [options]="memberOptions()"
                    [ngModel]="l.memberId ?? free" (ngModelChange)="assign(l, $event)" [disabled]="busy()"></ds-select>
                </div>
              } @else {
                {{ memberName(l.memberId) }}
              }
            </ng-template>
            <ng-template dsCell="status" let-l>
              <ds-badge size="sm" [status]="lotBadgeOf(l)">{{ lotLabelOf(l) }}</ds-badge>
            </ng-template>
          </ds-table>

          @if (canEdit()) {
            <footer class="cp-project__foot">
              <ds-button variant="ghost" size="sm" prefixIcon="plus" (dsClick)="openAddLot(p)">Ajouter un lot</ds-button>
            </footer>
          }
        </section>
      </ds-card>
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
  private readonly dialog = inject(DsDialogService);

  readonly projects = signal<CoopProject[]>([]);
  readonly loading = signal(true);
  readonly lots = signal<Record<number, CoopLot[]>>({});
  readonly busy = signal(false);
  readonly projectLabels = PROJECT_STATUS_LABELS;
  readonly lotLabels = LOT_STATUS_LABELS;
  readonly projectBadge = PROJECT_BADGE;
  readonly lotColumns: DsColumn<CoopLot>[] = [
    { key: 'lotNumber', header: 'Lot', width: '110px' },
    { key: 'surfaceArea', header: 'Surface', width: '110px' },
    { key: 'price', header: 'Prix', width: '150px', align: 'right' },
    { key: 'member', header: 'Membre' },
    { key: 'status', header: 'Statut', width: '130px' },
  ];
  readonly trackLot = (_: number, l: CoopLot) => l.id;
  readonly projectStatusOptions: DsSelectOption[] = (Object.keys(PROJECT_STATUS_LABELS) as CoopProjectStatus[])
    .map(s => ({ value: s, label: PROJECT_STATUS_LABELS[s] }));
  readonly memberOptions = computed<DsSelectOption[]>(() => [
    { value: FREE, label: 'Non attribué' },
    ...this.members().map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName}` })),
  ]);

  ngOnInit(): void {
    this.api.projects(this.groupId()).subscribe({
      next: list => {
        this.projects.set(list);
        this.loading.set(false);
        list.forEach(p => this.loadLots(p.id));
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(serverMessage(err, 'Impossible de charger les projets'));
      },
    });
  }

  money(v: number | null, currency?: string | null): string {
    return formatMoney(v, currency);
  }

  lotBadgeOf(l: CoopLot): DsBadgeStatus {
    return LOT_BADGE[l.status] ?? 'neutral';
  }

  lotLabelOf(l: CoopLot): string {
    return LOT_STATUS_LABELS[l.status] ?? l.status;
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

  /** Ouvre la boîte de création d'un projet. */
  openAdd(): void {
    const data: CoopProjectDialogData = { groupId: this.groupId() };
    this.dialog
      .open<CoopProject>(CoopProjectDialogComponent, { data, width: '560px' })
      .closed.subscribe(p => {
        if (!p) return;
        this.projects.update(list => [...list, p]);
        this.lots.update(map => ({ ...map, [p.id]: [] }));
      });
  }

  openAddLot(project: CoopProject): void {
    const data: CoopLotDialogData = { project };
    this.dialog
      .open<CoopLot>(CoopLotDialogComponent, { data, width: '520px' })
      .closed.subscribe(lot => {
        if (lot) this.lots.update(map => ({ ...map, [project.id]: [...(map[project.id] ?? []), lot] }));
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

  private loadLots(projectId: number): void {
    this.api.lots(projectId).subscribe({
      next: list => this.lots.update(map => ({ ...map, [projectId]: list })),
      error: () => this.lots.update(map => ({ ...map, [projectId]: [] })),
    });
  }
}
