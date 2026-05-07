import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TaskResponse, TaskPriority, TaskStatus } from '../services/task-api.service';
import { fadeIn, scaleIn } from '../animations';
import { DsCardComponent, DsButtonComponent, DsIconComponent } from '../design-system';

@Component({
    selector: 'app-task-card',
    standalone: true,
    templateUrl: './task-card.component.html',
    styleUrls: ['./task-card.component.css'],
    animations: [fadeIn, scaleIn],
    imports: [DsCardComponent, DsButtonComponent, DsIconComponent, DatePipe]
})
export class TaskCardComponent {
  readonly task = input.required<TaskResponse>();
  readonly taskUpdated = output<TaskResponse>();
  readonly taskDeleted = output<number>();
  readonly taskCompleted = output<number>();
  readonly taskEdit = output<TaskResponse>();

  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;

  get priorityColor(): string {
    switch (this.task().priority) {
      case TaskPriority.HIGH:
        return 'high';
      case TaskPriority.MEDIUM:
        return 'medium';
      case TaskPriority.LOW:
        return 'low';
      default:
        return 'medium';
    }
  }

  get priorityLabel(): string {
    switch (this.task().priority) {
      case TaskPriority.HIGH:
        return 'Haute';
      case TaskPriority.MEDIUM:
        return 'Moyenne';
      case TaskPriority.LOW:
        return 'Basse';
      default:
        return 'Moyenne';
    }
  }

  get isOverdue(): boolean {
    const task = this.task();
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
      return false;
    }
    return new Date(task.dueDate) < new Date();
  }

  get isApproaching(): boolean {
    const task = this.task();
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
      return false;
    }
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 3;
  }

  get dueDateLabel(): string {
    const task = this.task();
    if (!task.dueDate) {
      return 'Sans échéance';
    }
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return `En retard de ${Math.abs(daysDiff)} jour${Math.abs(daysDiff) === 1 ? '' : 's'}`;
    } else if (daysDiff === 0) {
      return "Aujourd'hui";
    } else if (daysDiff === 1) {
      return 'Demain';
    } else if (daysDiff <= 7) {
      return `Dans ${daysDiff} jours`;
    } else {
      return dueDate.toLocaleDateString('fr-FR');
    }
  }

  onCheckboxChange(): void {
    this.taskCompleted.emit(this.task().id);
  }

  onEdit(): void {
    this.taskEdit.emit(this.task());
  }

  onDelete(): void {
    this.taskDeleted.emit(this.task().id);
  }
}
