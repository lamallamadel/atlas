import { Component, OnInit, OnChanges, SimpleChanges, input, output } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DossierResponse, DossierStatus, DossierApiService } from '../services/dossier-api.service';
import { ToastNotificationService } from '../services/toast-notification.service';
import {
  KanbanColumnComponent,
  type DsBadgeStatus,
  type DsKanbanCard,
  type DsKanbanColumn,
  type DsKanbanDropEvent,
} from '../design-system';
import { DsSkeletonComponent } from '../design-system/primitives/ds-skeleton/ds-skeleton.component';

interface KanbanColumn {
  id: DossierStatus;
  title: string;
  dossiers: DossierResponse[];
  allowedTransitions: DossierStatus[];
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.css'],
  imports: [KanbanColumnComponent, DsSkeletonComponent],
})
export class KanbanBoardComponent implements OnInit, OnChanges {
  readonly dossiers = input<DossierResponse[]>([]);
  readonly loading = input(false);
  readonly quickFilter = input('');
  readonly dossierClick = output<DossierResponse>();
  readonly dossierUpdated = output<void>();

  columns: KanbanColumn[] = [];
  filteredColumns: KanbanColumn[] = [];
  /** Colonnes branchées sur `ds-kanban-column` (cartes dérivées des dossiers filtrés). */
  dsKanbanColumns: DsKanbanColumn[] = [];

  private readonly workflowTransitions: Record<DossierStatus, DossierStatus[]> = {
    [DossierStatus.NEW]: [DossierStatus.QUALIFYING, DossierStatus.LOST],
    [DossierStatus.QUALIFYING]: [DossierStatus.NEW, DossierStatus.QUALIFIED, DossierStatus.LOST],
    [DossierStatus.QUALIFIED]: [DossierStatus.QUALIFYING, DossierStatus.APPOINTMENT, DossierStatus.LOST],
    [DossierStatus.APPOINTMENT]: [DossierStatus.QUALIFIED, DossierStatus.WON, DossierStatus.LOST],
    [DossierStatus.WON]: [],
    [DossierStatus.LOST]: [DossierStatus.NEW, DossierStatus.QUALIFYING],
  };

  constructor(
    private dossierApiService: DossierApiService,
    private toastService: ToastNotificationService,
  ) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.distributeDosiersToColumns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossiers'] && !changes['dossiers'].firstChange) {
      this.distributeDosiersToColumns();
    }
    if (changes['quickFilter']) {
      this.applyQuickFilter();
    }
  }

  private initializeColumns(): void {
    this.columns = [
      {
        id: DossierStatus.NEW,
        title: 'Nouveau',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.NEW],
      },
      {
        id: DossierStatus.QUALIFYING,
        title: 'Qualification',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.QUALIFYING],
      },
      {
        id: DossierStatus.QUALIFIED,
        title: 'Qualifié',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.QUALIFIED],
      },
      {
        id: DossierStatus.APPOINTMENT,
        title: 'Rendez-vous',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.APPOINTMENT],
      },
      {
        id: DossierStatus.WON,
        title: 'Gagné',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.WON],
      },
      {
        id: DossierStatus.LOST,
        title: 'Perdu',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.LOST],
      },
    ];
  }

  private distributeDosiersToColumns(): void {
    this.columns.forEach((column) => {
      column.dossiers = this.dossiers().filter((d) => d.status === column.id);
    });
    this.applyQuickFilter();
  }

  private applyQuickFilter(): void {
    const quickFilter = this.quickFilter();
    if (!quickFilter || quickFilter.trim() === '') {
      this.filteredColumns = this.columns;
    } else {
      const filter = quickFilter.toLowerCase().trim();
      this.filteredColumns = this.columns.map((column) => ({
        ...column,
        dossiers: column.dossiers.filter(
          (dossier) =>
            dossier.leadName?.toLowerCase().includes(filter) ||
            dossier.leadPhone?.toLowerCase().includes(filter) ||
            dossier.annonceTitle?.toLowerCase().includes(filter) ||
            dossier.id.toString().includes(filter),
        ),
      }));
    }
    this.syncDsKanbanColumns();
  }

  private syncDsKanbanColumns(): void {
    this.dsKanbanColumns = this.filteredColumns.map((fc) => ({
      id: fc.id,
      label: fc.title,
      color: this.columnDsColor(fc.id),
      cards: fc.dossiers.map((d) => this.dossierToKanbanCard(d)),
    }));
  }

  private columnDsColor(
    id: DossierStatus,
  ): NonNullable<DsKanbanColumn['color']> {
    switch (id) {
      case DossierStatus.NEW:
        return 'warning';
      case DossierStatus.QUALIFYING:
      case DossierStatus.APPOINTMENT:
        return 'marine';
      case DossierStatus.QUALIFIED:
        return 'success';
      case DossierStatus.WON:
        return 'success';
      case DossierStatus.LOST:
        return 'error';
      default:
        return 'neutral';
    }
  }

  private dossierBadgeStatus(status: DossierStatus): DsBadgeStatus {
    switch (status) {
      case DossierStatus.NEW:
        return 'new';
      case DossierStatus.QUALIFYING:
        return 'qualification';
      case DossierStatus.QUALIFIED:
        return 'info';
      case DossierStatus.APPOINTMENT:
        return 'rdv';
      case DossierStatus.WON:
        return 'won';
      case DossierStatus.LOST:
        return 'lost';
      default:
        return 'neutral';
    }
  }

  private dossierToKanbanCard(d: DossierResponse): DsKanbanCard {
    const subtitleParts = [d.leadPhone, d.annonceTitle].filter(Boolean) as string[];
    const tags: string[] = [];
    if (d.score !== null && d.score !== undefined) {
      tags.push(`Score ${d.score}`);
    }
    const src = d.leadSource || d.source;
    if (src) {
      tags.push(String(src));
    }
    const updated = d.updatedAt ? new Date(d.updatedAt) : null;
    return {
      id: d.id,
      title: d.leadName?.trim() || `Dossier #${d.id}`,
      subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
      status: d.status,
      badge: `#${d.id}`,
      badgeStatus: this.dossierBadgeStatus(d.status),
      dueDate: updated
        ? updated.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : undefined,
      tags: tags.length ? tags : undefined,
      meta: { dossierId: String(d.id) },
    };
  }

  get kanbanConnectedLists(): string[] {
    return this.dsKanbanColumns.map((c) => 'dsk-' + c.id);
  }

  async onKanbanCardDropped(ev: DsKanbanDropEvent): Promise<void> {
    if (ev.fromColumn === ev.toColumn) {
      return;
    }

    const from = ev.fromColumn as DossierStatus;
    const to = ev.toColumn as DossierStatus;
    const dossier = this.dossiers().find((d) => d.id === Number(ev.card.id));
    if (!dossier) {
      this.syncDsKanbanColumns();
      return;
    }

    if (!this.isTransitionAllowed(from, to)) {
      this.toastService.warning(
        `Transition non autorisée : de « ${this.columnTitle(from)} » vers « ${this.columnTitle(to)} »`,
      );
      this.syncDsKanbanColumns();
      return;
    }

    const previousStatus = dossier.status;
    dossier.status = to;
    this.distributeDosiersToColumns();

    try {
      await firstValueFrom(this.dossierApiService.patchStatus(dossier.id, to));
      this.toastService.success(`Dossier #${dossier.id} déplacé vers « ${this.columnTitle(to)} »`);
      this.dossierUpdated.emit();
    } catch (error) {
      console.error('Failed to update dossier status:', error);
      dossier.status = previousStatus;
      this.distributeDosiersToColumns();
      this.toastService.error('Échec de la mise à jour du statut. Veuillez réessayer.');
    }
  }

  private columnTitle(status: DossierStatus): string {
    return this.columns.find((c) => c.id === status)?.title ?? status;
  }

  private isTransitionAllowed(from: DossierStatus, to: DossierStatus): boolean {
    return this.workflowTransitions[from]?.includes(to) || false;
  }

  onKanbanCardClick(card: DsKanbanCard): void {
    const dossier = this.dossiers().find((d) => d.id === Number(card.id));
    if (dossier) {
      this.dossierClick.emit(dossier);
    }
  }

  trackByColumnId(index: number, column: DsKanbanColumn): DossierStatus {
    return column.id as DossierStatus;
  }
}
