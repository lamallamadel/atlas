import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TaskResponse, TaskPriority, TaskStatus } from '../services/task-api.service';
import { fadeIn, scaleIn } from '../animations';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css'],
  animations: [fadeIn, scaleIn]
})
export class TaskCardComponent {
  @Input() task!: TaskResponse;
  @Output() taskUpdated = new EventEmitter<TaskResponse>();
  @Output() taskDeleted = new EventEmitter<number>();
  @Output() taskCompleted = new EventEmitter<number>();
  @Output() taskEdit = new EventEmitter<TaskResponse>();

  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;

  get priorityColor(): string {
    switch (this.task.priority) {
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
    switch (this.task.priority) {
      case TaskPriority.HIGH:
        return 'High';
      case TaskPriority.MEDIUM:
        return 'Medium';
      case TaskPriority.LOW:
        return 'Low';
      default:
        return 'Medium';
    }
  }

  get isOverdue(): boolean {
    if (!this.task.dueDate || this.task.status === TaskStatus.COMPLETED) {
      return false;
    }
    return new Date(this.task.dueDate) < new Date();
  }

  get isApproaching(): boolean {
    if (!this.task.dueDate || this.task.status === TaskStatus.COMPLETED) {
      return false;
    }
    const dueDate = new Date(this.task.dueDate);
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 3;
  }

  get dueDateLabel(): string {
    if (!this.task.dueDate) {
      return 'No due date';
    }
    const dueDate = new Date(this.task.dueDate);
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? '' : 's'}`;
    } else if (daysDiff === 0) {
      return 'Due today';
    } else if (daysDiff === 1) {
      return 'Due tomorrow';
    } else if (daysDiff <= 7) {
      return `Due in ${daysDiff} days`;
    } else {
      return dueDate.toLocaleDateString('fr-FR');
    }
  }

  onCheckboxChange(event: any): void {
    if (event.checked) {
      this.taskCompleted.emit(this.task.id);
    } else {
      this.taskCompleted.emit(this.task.id);
    }
  }

  onEdit(): void {
    this.taskEdit.emit(this.task);
  }

  onDelete(): void {
    this.taskDeleted.emit(this.task.id);
  }
}
