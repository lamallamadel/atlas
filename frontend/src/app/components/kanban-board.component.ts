import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DossierResponse, DossierStatus, DossierApiService } from '../services/dossier-api.service';
import { ToastNotificationService } from '../services/toast-notification.service';

interface KanbanColumn {
  id: DossierStatus;
  title: string;
  icon: string;
  badgeClass: string;
  dossiers: DossierResponse[];
  allowedTransitions: DossierStatus[];
}

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.css']
})
export class KanbanBoardComponent implements OnInit, OnChanges {
  @Input() dossiers: DossierResponse[] = [];
  @Input() loading = false;
  @Input() quickFilter = '';
  @Output() dossierClick = new EventEmitter<DossierResponse>();
  @Output() dossierUpdated = new EventEmitter<void>();

  columns: KanbanColumn[] = [];
  filteredColumns: KanbanColumn[] = [];

  private readonly workflowTransitions: Record<DossierStatus, DossierStatus[]> = {
    [DossierStatus.NEW]: [DossierStatus.QUALIFYING, DossierStatus.LOST],
    [DossierStatus.QUALIFYING]: [DossierStatus.NEW, DossierStatus.QUALIFIED, DossierStatus.LOST],
    [DossierStatus.QUALIFIED]: [DossierStatus.QUALIFYING, DossierStatus.APPOINTMENT, DossierStatus.LOST],
    [DossierStatus.APPOINTMENT]: [DossierStatus.QUALIFIED, DossierStatus.WON, DossierStatus.LOST],
    [DossierStatus.WON]: [],
    [DossierStatus.LOST]: [DossierStatus.NEW, DossierStatus.QUALIFYING]
  };

  constructor(
    private dossierApiService: DossierApiService,
    private toastService: ToastNotificationService
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
        icon: 'fiber_new',
        badgeClass: 'badge-new',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.NEW]
      },
      {
        id: DossierStatus.QUALIFYING,
        title: 'Qualification',
        icon: 'hourglass_empty',
        badgeClass: 'badge-qualifying',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.QUALIFYING]
      },
      {
        id: DossierStatus.QUALIFIED,
        title: 'Qualifié',
        icon: 'verified',
        badgeClass: 'badge-qualified',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.QUALIFIED]
      },
      {
        id: DossierStatus.APPOINTMENT,
        title: 'Rendez-vous',
        icon: 'event',
        badgeClass: 'badge-appointment',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.APPOINTMENT]
      },
      {
        id: DossierStatus.WON,
        title: 'Gagné',
        icon: 'emoji_events',
        badgeClass: 'badge-won',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.WON]
      },
      {
        id: DossierStatus.LOST,
        title: 'Perdu',
        icon: 'cancel',
        badgeClass: 'badge-lost',
        dossiers: [],
        allowedTransitions: this.workflowTransitions[DossierStatus.LOST]
      }
    ];
  }

  private distributeDosiersToColumns(): void {
    this.columns.forEach(column => {
      column.dossiers = this.dossiers.filter(d => d.status === column.id);
    });
    this.applyQuickFilter();
  }

  private applyQuickFilter(): void {
    if (!this.quickFilter || this.quickFilter.trim() === '') {
      this.filteredColumns = this.columns;
      return;
    }

    const filter = this.quickFilter.toLowerCase().trim();
    this.filteredColumns = this.columns.map(column => ({
      ...column,
      dossiers: column.dossiers.filter(dossier => 
        (dossier.leadName?.toLowerCase().includes(filter)) ||
        (dossier.leadPhone?.toLowerCase().includes(filter)) ||
        (dossier.annonceTitle?.toLowerCase().includes(filter)) ||
        (dossier.id.toString().includes(filter))
      )
    }));
  }

  getConnectedLists(): string[] {
    return this.columns.map(c => c.id);
  }

  async onDrop(event: CdkDragDrop<DossierResponse[]>, targetColumn: KanbanColumn): Promise<void> {
    const dossier = event.item.data as DossierResponse;
    const sourceColumn = this.columns.find(c => c.dossiers.includes(dossier));
    
    if (!sourceColumn) {
      return;
    }

    if (sourceColumn.id === targetColumn.id) {
      moveItemInArray(targetColumn.dossiers, event.previousIndex, event.currentIndex);
      return;
    }

    if (!this.isTransitionAllowed(sourceColumn.id, targetColumn.id)) {
      this.toastService.warning(
        `Transition non autorisée: de "${sourceColumn.title}" vers "${targetColumn.title}"`
      );
      return;
    }

    const previousStatus = dossier.status;
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    dossier.status = targetColumn.id;

    try {
      await this.dossierApiService.patchStatus(dossier.id, targetColumn.id).toPromise();
      this.toastService.success(
        `Dossier #${dossier.id} déplacé vers "${targetColumn.title}"`
      );
      this.dossierUpdated.emit();
    } catch (error) {
      console.error('Failed to update dossier status:', error);
      
      dossier.status = previousStatus;
      transferArrayItem(
        event.container.data,
        event.previousContainer.data,
        event.currentIndex,
        event.previousIndex
      );

      this.toastService.error(
        'Échec de la mise à jour du statut. Veuillez réessayer.'
      );
    }
  }

  private isTransitionAllowed(from: DossierStatus, to: DossierStatus): boolean {
    return this.workflowTransitions[from]?.includes(to) || false;
  }

  onCardClick(dossier: DossierResponse): void {
    this.dossierClick.emit(dossier);
  }

  getColumnCount(column: KanbanColumn): number {
    return column.dossiers.length;
  }

  getFilteredColumnCount(column: KanbanColumn): number {
    const filtered = this.filteredColumns.find(c => c.id === column.id);
    return filtered?.dossiers.length || 0;
  }

  trackByDossierId(index: number, dossier: DossierResponse): number {
    return dossier.id;
  }

  trackByColumnId(index: number, column: KanbanColumn): DossierStatus {
    return column.id;
  }
}
