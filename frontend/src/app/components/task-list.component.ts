import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskApiService, TaskResponse, TaskStatus, TaskPriority, TaskListParams } from '../services/task-api.service';
import { TaskFormDialogComponent } from './task-form-dialog.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { AuthService } from '../services/auth.service';
import { cardStagger } from '../animations';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { TaskCardComponent } from './task-card.component';
import {
  PageHeaderComponent,
  DsButtonComponent,
  DsCardComponent,
  DsTabsComponent,
  DsEmptyStateComponent,
  DsSkeletonComponent,
  DsTableComponent,
  WeekGridComponent,
  type DsTab,
  type WeekGridEvent,
  type WeekGridClickEvent,
  type DsColumn,
  type DsRowAction,
} from '../design-system';

enum ViewMode {
  LIST = 'list',
  CALENDAR = 'calendar',
}

enum FilterType {
  ASSIGNED_TO_ME = 'assignedToMe',
  ALL = 'all',
}

enum StatusFilter {
  OVERDUE = 'overdue',
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  ALL = 'all',
}

type TaskListLayout = 'cards' | 'table';

@Component({
  selector: 'app-task-list',
  standalone: true,
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
  animations: [cardStagger],
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    TaskCardComponent,
    WeekGridComponent,
    PageHeaderComponent,
    DsButtonComponent,
    DsCardComponent,
    DsTabsComponent,
    DsEmptyStateComponent,
    DsSkeletonComponent,
    DsTableComponent,
  ],
})
export class TaskListComponent implements OnInit {
  tasks: TaskResponse[] = [];
  filteredTasks: TaskResponse[] = [];
  loading = false;
  currentUserId = '';

  viewMode: ViewMode = ViewMode.LIST;
  ViewMode = ViewMode;

  /** Vue liste : cartes existantes ou tableau DS. */
  listLayout: TaskListLayout = 'cards';

  filterType: FilterType = FilterType.ALL;
  FilterType = FilterType;

  statusFilter: StatusFilter = StatusFilter.ALL;
  StatusFilter = StatusFilter;

  weekGridDate = new Date();
  weekGridEvents: WeekGridEvent[] = [];

  readonly assignmentTabs: DsTab[] = [
    { value: FilterType.ALL, label: 'Toutes les tâches' },
    { value: FilterType.ASSIGNED_TO_ME, label: 'Assignées à moi' },
  ];

  readonly viewTabs: DsTab[] = [
    { value: ViewMode.LIST, label: 'Liste' },
    { value: ViewMode.CALENDAR, label: 'Semaine' },
  ];

  readonly dsTableRowActions: DsRowAction<Record<string, unknown>>[] = [
    {
      icon: 'check',
      label: 'Terminer',
      action: 'complete',
      ariaLabel: 'Marquer comme terminée',
      show: (row) => this.taskFromRow(row).status !== TaskStatus.COMPLETED,
    },
    {
      icon: 'refresh',
      label: 'Rouvrir',
      action: 'uncomplete',
      ariaLabel: 'Rouvrir la tâche',
      show: (row) => this.taskFromRow(row).status === TaskStatus.COMPLETED,
    },
    { icon: 'edit', label: 'Modifier', action: 'edit', ariaLabel: 'Modifier la tâche' },
    { icon: 'trash', label: 'Supprimer', action: 'delete', ariaLabel: 'Supprimer la tâche' },
  ];

  dsTableColumns: DsColumn<Record<string, unknown>>[] = [];

  get filteredTasksAsTableRows(): Record<string, unknown>[] {
    return this.filteredTasks as unknown as Record<string, unknown>[];
  }

  trackByTaskId = (_index: number, row: Record<string, unknown>): number =>
    this.taskFromRow(row).id;

  constructor(
    private taskApiService: TaskApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dsTableColumns = this.buildDsTableColumns();
    this.currentUserId = this.authService.getUserId() || '';
    this.loadTasks();
  }

  get filterTypeAsString(): string {
    return this.filterType;
  }

  get viewModeAsString(): string {
    return this.viewMode;
  }

  onAssignmentSegmentChange(value: string): void {
    this.filterType = value === FilterType.ASSIGNED_TO_ME ? FilterType.ASSIGNED_TO_ME : FilterType.ALL;
    this.applyFilters();
  }

  onViewSegmentChange(value: string): void {
    this.viewMode = value === ViewMode.CALENDAR ? ViewMode.CALENDAR : ViewMode.LIST;
  }

  onWeekGridDateChange(d: Date): void {
    this.weekGridDate = d;
  }

  loadTasks(): void {
    this.loading = true;
    const params: TaskListParams = {
      size: 1000,
      sort: 'dueDate,asc',
    };

    this.taskApiService.list(params).subscribe({
      next: (page) => {
        this.tasks = page.content;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.snackBar.open('Impossible de charger les tâches', 'Fermer', { duration: 4000 });
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.tasks];

    if (this.filterType === FilterType.ASSIGNED_TO_ME) {
      filtered = filtered.filter((task) => task.assignedTo === this.currentUserId);
    }

    if (this.statusFilter === StatusFilter.OVERDUE) {
      filtered = filtered.filter((task) => {
        if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
          return false;
        }
        return new Date(task.dueDate) < new Date();
      });
    } else if (this.statusFilter === StatusFilter.UPCOMING) {
      filtered = filtered.filter((task) => {
        if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
          return false;
        }
        return new Date(task.dueDate) >= new Date();
      });
    } else if (this.statusFilter === StatusFilter.COMPLETED) {
      filtered = filtered.filter((task) => task.status === TaskStatus.COMPLETED);
    }

    this.filteredTasks = filtered;
    this.rebuildWeekGridEvents();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  private rebuildWeekGridEvents(): void {
    this.weekGridEvents = this.filteredTasks
      .filter((t) => !!t.dueDate)
      .map((task) => {
        const start = new Date(task.dueDate!);
        if (start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0) {
          start.setHours(9, 0, 0, 0);
        }
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return {
          id: task.id,
          title: task.title,
          start,
          end,
          type: 'task' as const,
          assigneeInitials: this.initialsFromName(task.assignedToName),
        };
      });
  }

  private initialsFromName(name?: string): string | undefined {
    if (!name?.trim()) return undefined;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onWeekGridEventClick(evt: WeekGridEvent): void {
    const task = this.tasks.find((t) => t.id === evt.id);
    if (task) {
      this.onTaskEdit(task);
    }
  }

  onWeekGridCellClick(ev: WeekGridClickEvent): void {
    const d = new Date(ev.date);
    if (ev.hour !== undefined) {
      d.setHours(ev.hour, 0, 0, 0);
    }
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '600px',
      data: {
        task: {
          dueDate: d.toISOString(),
        },
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Tâche créée', 'OK', { duration: 3000 });
        this.loadTasks();
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '600px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Tâche créée', 'OK', { duration: 3000 });
        this.loadTasks();
      }
    });
  }

  onTaskEdit(task: TaskResponse): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '600px',
      data: { task },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Tâche mise à jour', 'OK', { duration: 3000 });
        this.loadTasks();
      }
    });
  }

  onTaskDelete(taskId: number): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: 'Supprimer la tâche',
        message: 'Supprimer cette tâche ? Cette action est définitive.',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.taskApiService.delete(taskId).subscribe({
          next: () => {
            this.snackBar.open('Tâche supprimée', 'OK', { duration: 3000 });
            this.loadTasks();
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            this.snackBar.open('Suppression impossible', 'Fermer', { duration: 4000 });
          },
        });
      }
    });
  }

  onTaskCompleted(taskId: number): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const apiCall =
      task.status === TaskStatus.COMPLETED
        ? this.taskApiService.uncomplete(taskId)
        : this.taskApiService.complete(taskId);

    apiCall.subscribe({
      next: () => {
        const done = task.status === TaskStatus.COMPLETED;
        this.snackBar.open(done ? 'Tâche rouverte' : 'Tâche terminée', 'OK', { duration: 3000 });
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.snackBar.open('Mise à jour impossible', 'Fermer', { duration: 4000 });
      },
    });
  }

  get overdueCount(): number {
    return this.tasks.filter((task) => {
      if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
        return false;
      }
      return new Date(task.dueDate) < new Date();
    }).length;
  }

  get upcomingCount(): number {
    return this.tasks.filter((task) => {
      if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
        return false;
      }
      return new Date(task.dueDate) >= new Date();
    }).length;
  }

  get completedCount(): number {
    return this.tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
  }

  onDsTableRowClick(row: Record<string, unknown>): void {
    this.onTaskEdit(this.taskFromRow(row));
  }

  onDsTableRowAction(event: { action: string; row: Record<string, unknown> }): void {
    const t = this.taskFromRow(event.row);
    switch (event.action) {
      case 'complete':
      case 'uncomplete':
        this.onTaskCompleted(t.id);
        break;
      case 'edit':
        this.onTaskEdit(t);
        break;
      case 'delete':
        this.onTaskDelete(t.id);
        break;
      default:
        break;
    }
  }

  private buildDsTableColumns(): DsColumn<Record<string, unknown>>[] {
    return [
      {
        key: 'title',
        header: 'Tâche',
        sortable: false,
        cell: (row) =>
          `<span class="task-ds-title">${this.escapeHtml(this.taskFromRow(row).title || '—')}</span>`,
      },
      {
        key: 'assignee',
        header: 'Assignée à',
        width: '160px',
        sortable: false,
        cell: (row) => {
          const name = this.taskFromRow(row).assignedToName || '—';
          return `<span class="task-ds-muted">${this.escapeHtml(name)}</span>`;
        },
      },
      {
        key: 'dueDate',
        header: 'Échéance',
        width: '180px',
        sortable: false,
        cell: (row) => {
          const t = this.taskFromRow(row);
          const text = this.formatDueSummary(t);
          const cls =
            t.status !== TaskStatus.COMPLETED && t.dueDate && new Date(t.dueDate) < new Date()
              ? 'task-ds-due task-ds-due--late'
              : 'task-ds-due';
          return `<span class="${cls}">${this.escapeHtml(text)}</span>`;
        },
      },
      {
        key: 'priority',
        header: 'Priorité',
        width: '110px',
        sortable: false,
        cell: (row) => {
          const p = this.taskFromRow(row).priority;
          const cls = this.priorityBadgeClass(p);
          const label = this.escapeHtml(this.priorityLabel(p));
          return `<span class="${cls}">${label}</span>`;
        },
      },
      {
        key: 'status',
        header: 'Statut',
        width: '120px',
        sortable: false,
        cell: (row) => {
          const s = this.taskFromRow(row).status;
          const cls = this.statusBadgeClass(s);
          const label = this.escapeHtml(this.statusLabel(s));
          return `<span class="${cls}">${label}</span>`;
        },
      },
    ];
  }

  private formatDueSummary(task: TaskResponse): string {
    if (!task.dueDate) {
      return 'Sans échéance';
    }
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (task.status === TaskStatus.COMPLETED) {
      return dueDate.toLocaleDateString('fr-FR');
    }
    if (daysDiff < 0) {
      return `En retard (${Math.abs(daysDiff)} j)`;
    }
    if (daysDiff === 0) {
      return "Aujourd'hui";
    }
    if (daysDiff === 1) {
      return 'Demain';
    }
    if (daysDiff <= 7) {
      return `J+${daysDiff}`;
    }
    return dueDate.toLocaleDateString('fr-FR');
  }

  private priorityLabel(p: TaskPriority): string {
    switch (p) {
      case TaskPriority.HIGH:
        return 'Haute';
      case TaskPriority.MEDIUM:
        return 'Moyenne';
      case TaskPriority.LOW:
        return 'Basse';
      default:
        return '—';
    }
  }

  private priorityBadgeClass(p: TaskPriority): string {
    switch (p) {
      case TaskPriority.HIGH:
        return 'ds-badge ds-badge--md ds-badge--no-dot ds-badge--error';
      case TaskPriority.MEDIUM:
        return 'ds-badge ds-badge--md ds-badge--no-dot ds-badge--warning';
      case TaskPriority.LOW:
        return 'ds-badge ds-badge--md ds-badge--no-dot ds-badge--neutral';
      default:
        return 'ds-badge ds-badge--md ds-badge--no-dot ds-badge--neutral';
    }
  }

  private statusLabel(s: TaskStatus): string {
    switch (s) {
      case TaskStatus.COMPLETED:
        return 'Terminée';
      case TaskStatus.IN_PROGRESS:
        return 'En cours';
      case TaskStatus.PENDING:
        return 'À faire';
      default:
        return String(s);
    }
  }

  private statusBadgeClass(s: TaskStatus): string {
    switch (s) {
      case TaskStatus.COMPLETED:
        return 'ds-badge ds-badge--md ds-badge--no-dot ds-badge--success';
      case TaskStatus.IN_PROGRESS:
        return 'ds-badge ds-badge--md ds-badge--no-dot ds-badge--info';
      default:
        return 'ds-badge ds-badge--md ds-badge--no-dot ds-badge--neutral';
    }
  }

  private escapeHtml(value: string): string {
    return (value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private taskFromRow(row: Record<string, unknown>): TaskResponse {
    return row as unknown as TaskResponse;
  }
}
