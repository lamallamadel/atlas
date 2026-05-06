import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskApiService, TaskResponse, TaskStatus, TaskPriority, TaskListParams } from '../services/task-api.service';
import { TaskFormDialogComponent } from './task-form-dialog.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { AuthService } from '../services/auth.service';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { cardStagger } from '../animations';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { TaskCardComponent } from './task-card.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import {
  PageHeaderComponent,
  DsButtonComponent,
  DsCardComponent,
  DsTabsComponent,
  DsEmptyStateComponent,
  DsSkeletonComponent,
  type DsTab,
} from '../design-system';
import { resolveDsToken } from '../design-system/chart-ds-colors';

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

@Component({
  selector: 'app-task-list',
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
    FullCalendarModule,
    PageHeaderComponent,
    DsButtonComponent,
    DsCardComponent,
    DsTabsComponent,
    DsEmptyStateComponent,
    DsSkeletonComponent,
  ],
})
export class TaskListComponent implements OnInit {
  tasks: TaskResponse[] = [];
  filteredTasks: TaskResponse[] = [];
  loading = false;
  currentUserId = '';

  viewMode: ViewMode = ViewMode.LIST;
  ViewMode = ViewMode;

  filterType: FilterType = FilterType.ALL;
  FilterType = FilterType;

  statusFilter: StatusFilter = StatusFilter.ALL;
  StatusFilter = StatusFilter;

  readonly assignmentTabs: DsTab[] = [
    { value: FilterType.ALL, label: 'Toutes les tâches' },
    { value: FilterType.ASSIGNED_TO_ME, label: 'Assignées à moi' },
  ];

  readonly viewTabs: DsTab[] = [
    { value: ViewMode.LIST, label: 'Liste' },
    { value: ViewMode.CALENDAR, label: 'Calendrier' },
  ];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: frLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek',
    },
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    height: 'auto',
  };

  constructor(
    private taskApiService: TaskApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
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
        this.updateCalendarEvents();
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
  }

  onStatusFilterChange(): void {
    this.applyFilters();
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

  private taskEventColor(task: TaskResponse): string {
    if (task.status === TaskStatus.COMPLETED) {
      return resolveDsToken('--ds-success');
    }
    const overdue = !!task.dueDate && new Date(task.dueDate) < new Date();
    if (overdue) {
      return resolveDsToken('--ds-error');
    }
    if (task.priority === TaskPriority.HIGH) {
      return resolveDsToken('--ds-error');
    }
    if (task.priority === TaskPriority.MEDIUM) {
      return resolveDsToken('--ds-warning');
    }
    return resolveDsToken('--ds-marine-light');
  }

  updateCalendarEvents(): void {
    const events: EventInput[] = this.tasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const color = this.taskEventColor(task);
        return {
          id: task.id.toString(),
          title: task.title,
          start: task.dueDate,
          backgroundColor: color,
          borderColor: color,
          extendedProps: {
            task,
          },
        };
      });

    this.calendarOptions = {
      ...this.calendarOptions,
      events,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleEventClick(arg: any): void {
    const task = arg.event.extendedProps.task as TaskResponse | undefined;
    if (task) {
      this.onTaskEdit(task);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleDateClick(arg: any): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '600px',
      data: {
        task: {
          dueDate: arg.dateStr,
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
}
