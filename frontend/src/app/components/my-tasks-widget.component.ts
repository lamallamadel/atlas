import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardWidgetBaseComponent } from './card-widget-base.component';
import { TaskApiService } from '../services/task-api.service';
import { takeUntil } from 'rxjs/operators';

interface Task {
  id: number;
  title: string;
  priority: string;
  dueDate: string;
  status: string;
}

@Component({
  selector: 'app-my-tasks-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="widget" [class.edit-mode]="editMode">
      <div class="widget-header">
        <h3>{{ config.title || 'Mes tâches' }}</h3>
        <div class="widget-actions" *ngIf="editMode">
          <button (click)="onRefresh()" class="btn-icon" title="Rafraîchir">
            <span class="material-icons">refresh</span>
          </button>
          <button (click)="onRemove()" class="btn-icon" title="Supprimer">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
      
      <div class="widget-content" *ngIf="!loading && !error">
        <div class="task-list" *ngIf="tasks.length > 0">
          <div *ngFor="let task of tasks" class="task-item">
            <div class="task-priority" [attr.data-priority]="task.priority"></div>
            <div class="task-info">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-due">
                <span class="material-icons">schedule</span>
                {{ task.dueDate | date:'short' }}
              </div>
            </div>
            <div class="task-status">
              <span class="badge" [attr.data-status]="task.status">
                {{ task.status }}
              </span>
            </div>
          </div>
        </div>
        <div class="empty-state" *ngIf="tasks.length === 0">
          <span class="material-icons">task_alt</span>
          <p>Aucune tâche en cours</p>
        </div>
      </div>

      <div class="widget-loading" *ngIf="loading">
        <div class="spinner"></div>
      </div>

      <div class="widget-error" *ngIf="error">
        <span class="material-icons">error</span>
        <p>{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .widget {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .widget.edit-mode {
      border: 2px dashed #ccc;
      cursor: move;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    .widget-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .widget-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #666;
      transition: color 0.2s;
    }

    .btn-icon:hover {
      color: #333;
    }

    .widget-content {
      flex: 1;
      overflow-y: auto;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #eee;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .task-item:hover {
      border-color: #1976d2;
      background: #f5f9ff;
    }

    .task-priority {
      width: 4px;
      height: 40px;
      border-radius: 2px;
    }

    .task-priority[data-priority="HIGH"] {
      background: #f44336;
    }

    .task-priority[data-priority="MEDIUM"] {
      background: #ff9800;
    }

    .task-priority[data-priority="LOW"] {
      background: #4caf50;
    }

    .task-info {
      flex: 1;
    }

    .task-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .task-due {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #666;
    }

    .task-due .material-icons {
      font-size: 16px;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background: #e3f2fd;
      color: #1976d2;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #999;
      gap: 8px;
    }

    .empty-state .material-icons {
      font-size: 48px;
    }

    .widget-loading,
    .widget-error {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 8px;
      color: #666;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .widget {
        padding: 16px;
      }

      .task-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .task-priority {
        width: 100%;
        height: 4px;
      }
    }
  `]
})
export class MyTasksWidgetComponent extends CardWidgetBaseComponent {
  tasks: Task[] = [];

  constructor(private taskService: TaskApiService) {
    super();
  }

  override loadData(): void {
    this.setLoading(true);
    this.setError(null);

    const statusFilter = this.config.settings?.['status'] as string || 'PENDING,IN_PROGRESS';

    this.taskService.list({ size: 50 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          const statuses = statusFilter.split(',');
          this.tasks = page.content
            .filter((t: { status: string }) => statuses.includes(t.status))
            .slice(0, 10)
            .map((t: { id: number; title: string; priority: string; dueDate?: string; status: string }) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              dueDate: t.dueDate || '',
              status: t.status
            }));
          this.setLoading(false);
        },
        error: () => {
          this.setError('Erreur de chargement des tâches');
          this.setLoading(false);
        }
      });
  }
}
