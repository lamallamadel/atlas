import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskApiService, TaskResponse, TaskStatus, TaskPriority, TaskListParams } from '../services/task-api.service';
import { TaskFormDialogComponent } from './task-form-dialog.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { AuthService } from '../services/auth.service';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { staggerList, cardStagger } from '../animations';

enum ViewMode {
  LIST = 'list',
  CALENDAR = 'calendar'
}

enum FilterType {
  ASSIGNED_TO_ME = 'assignedToMe',
  ALL = 'all'
}

enum StatusFilter {
  OVERDUE = 'overdue',
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  ALL = 'all'
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
  animations: [staggerList, cardStagger]
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

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    height: 'auto'
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

  loadTasks(): void {
    this.loading = true;
    const params: TaskListParams = {
      size: 1000,
      sort: 'dueDate,asc'
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
        this.snackBar.open('Error loading tasks', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.tasks];

    if (this.filterType === FilterType.ASSIGNED_TO_ME) {
      filtered = filtered.filter(task => task.assignedTo === this.currentUserId);
    }

    if (this.statusFilter === StatusFilter.OVERDUE) {
      filtered = filtered.filter(task => {
        if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
          return false;
        }
        return new Date(task.dueDate) < new Date();
      });
    } else if (this.statusFilter === StatusFilter.UPCOMING) {
      filtered = filtered.filter(task => {
        if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
          return false;
        }
        return new Date(task.dueDate) >= new Date();
      });
    } else if (this.statusFilter === StatusFilter.COMPLETED) {
      filtered = filtered.filter(task => task.status === TaskStatus.COMPLETED);
    }

    this.filteredTasks = filtered;
  }

  onFilterTypeChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode = mode;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task created successfully', 'Close', { duration: 3000 });
        this.loadTasks();
      }
    });
  }

  onTaskEdit(task: TaskResponse): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '600px',
      data: { task }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
        this.loadTasks();
      }
    });
  }

  onTaskDelete(taskId: number): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: 'Delete Task',
        message: 'Are you sure you want to delete this task? This action cannot be undone.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.taskApiService.delete(taskId).subscribe({
          next: () => {
            this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
            this.loadTasks();
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            this.snackBar.open('Error deleting task', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  onTaskCompleted(taskId: number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const apiCall = task.status === TaskStatus.COMPLETED 
      ? this.taskApiService.uncomplete(taskId)
      : this.taskApiService.complete(taskId);

    apiCall.subscribe({
      next: () => {
        const action = task.status === TaskStatus.COMPLETED ? 'reopened' : 'completed';
        this.snackBar.open(`Task ${action} successfully`, 'Close', { duration: 3000 });
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.snackBar.open('Error updating task', 'Close', { duration: 3000 });
      }
    });
  }

  updateCalendarEvents(): void {
    const events: EventInput[] = this.tasks
      .filter(task => task.dueDate)
      .map(task => {
        let color = '#2196f3';
        
        if (task.status === TaskStatus.COMPLETED) {
          color = '#4caf50';
        } else if (task.priority === TaskPriority.HIGH) {
          color = '#e74c3c';
        } else if (task.priority === TaskPriority.MEDIUM) {
          color = '#f39c12';
        } else {
          color = '#27ae60';
        }

        const isOverdue = task.status !== TaskStatus.COMPLETED && 
                         new Date(task.dueDate!) < new Date();
        
        if (isOverdue) {
          color = '#c0392b';
        }

        return {
          id: task.id.toString(),
          title: task.title,
          start: task.dueDate,
          backgroundColor: color,
          borderColor: color,
          extendedProps: {
            task: task
          }
        };
      });

    this.calendarOptions = {
      ...this.calendarOptions,
      events: events
    };
  }

  handleEventClick(arg: any): void {
    const task = arg.event.extendedProps.task;
    if (task) {
      this.onTaskEdit(task);
    }
  }

  handleDateClick(arg: any): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '600px',
      data: {
        task: {
          dueDate: arg.dateStr
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task created successfully', 'Close', { duration: 3000 });
        this.loadTasks();
      }
    });
  }

  get overdueCount(): number {
    return this.tasks.filter(task => {
      if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
        return false;
      }
      return new Date(task.dueDate) < new Date();
    }).length;
  }

  get upcomingCount(): number {
    return this.tasks.filter(task => {
      if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
        return false;
      }
      return new Date(task.dueDate) >= new Date();
    }).length;
  }

  get completedCount(): number {
    return this.tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
  }
}
