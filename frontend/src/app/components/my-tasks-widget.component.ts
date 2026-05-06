import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { DsCardComponent } from '../design-system/primitives/ds-card/ds-card.component';
import { DashboardWidgetBase } from './dashboard-widget-base';
import { TaskApiService } from '../services/task-api.service';

interface Task {
  id: number;
  title: string;
  priority: string;
  dueDate: string;
  status: string;
}

@Component({
  standalone: true,
  selector: 'app-my-tasks-widget',
  imports: [CommonModule, RouterModule, DsCardComponent],
  template: `
    <div class="widget-shell">
      <ds-card [pad]="false" [elevation]="'sm'">
        <div class="widget-body" [class.edit-mode]="editMode">
          <div class="widget-header">
            <h3>{{ config.title || 'Mes tâches' }}</h3>
            @if (editMode) {
              <div class="widget-actions">
                <button type="button" (click)="onRefresh()" class="btn-icon" title="Rafraîchir">
                  <span class="material-icons">refresh</span>
                </button>
                <button type="button" (click)="onRemove()" class="btn-icon" title="Supprimer">
                  <span class="material-icons">close</span>
                </button>
              </div>
            }
          </div>

          @if (!loading && !error) {
            <div class="widget-content">
              @if (tasks.length > 0) {
                <div class="task-list">
                  @for (task of tasks; track task.id) {
                    <div class="task-item">
                      <div class="task-priority" [attr.data-priority]="task.priority"></div>
                      <div class="task-info">
                        <div class="task-title">{{ task.title }}</div>
                        <div class="task-due">
                          <span class="material-icons">schedule</span>
                          {{ task.dueDate | date: 'short' }}
                        </div>
                      </div>
                      <div class="task-status">
                        <span class="badge" [attr.data-status]="task.status">
                          {{ task.status }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
              @if (tasks.length === 0) {
                <div class="empty-state">
                  <span class="material-icons">task_alt</span>
                  <p>Aucune tâche en cours</p>
                </div>
              }
            </div>
          }

          @if (loading) {
            <div class="widget-loading">
              <div class="spinner"></div>
            </div>
          }

          @if (error) {
            <div class="widget-error">
              <span class="material-icons">error</span>
              <p>{{ error }}</p>
            </div>
          }
        </div>
      </ds-card>
    </div>
  `,
  styleUrls: ['./dashboard-widget-shared.scss', './my-tasks-widget.component.scss'],
})
export class MyTasksWidgetComponent extends DashboardWidgetBase {
  tasks: Task[] = [];

  constructor(private taskService: TaskApiService) {
    super();
  }

  override loadData(): void {
    this.setLoading(true);
    this.setError(null);

    const statusFilter = (this.config.settings?.['status'] as string) || 'PENDING,IN_PROGRESS';

    this.taskService
      .list({ size: 50 })
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
              status: t.status,
            }));
          this.setLoading(false);
        },
        error: () => {
          this.setError('Erreur de chargement des tâches');
          this.setLoading(false);
        },
      });
  }
}
