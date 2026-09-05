import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { DsDialogHeaderComponent, DsDialogContentComponent, DsDialogActionsComponent } from '../design-system';
import { TaskApiService, TaskResponse, TaskPriority, User } from '../services/task-api.service';
import { FocusTrapDirective } from '../directives/focus-trap.directive';
import { DsSkeletonComponent, DsSelectComponent, type DsSelectOption, DsInputComponent, DsIconComponent, DsButtonComponent } from '../design-system';

export interface TaskFormData {
  task?: TaskResponse;
}

@Component({
    selector: 'app-task-form-dialog',
    standalone: true,
    templateUrl: './task-form-dialog.component.html',
    styleUrls: ['./task-form-dialog.component.css'],
    imports: [FocusTrapDirective, DsDialogHeaderComponent, DsDialogContentComponent, DsDialogActionsComponent, ReactiveFormsModule, DsSkeletonComponent, DsSelectComponent, DsInputComponent, DsIconComponent, DsButtonComponent]
})
export class TaskFormDialogComponent implements OnInit {
  taskForm: FormGroup;
  users: User[] = [];
  priorities: DsSelectOption[] = [
    { value: TaskPriority.HIGH, label: 'Haute' },
    { value: TaskPriority.MEDIUM, label: 'Moyenne' },
    { value: TaskPriority.LOW, label: 'Basse' }
  ];
  isEditMode = false;
  loading = false;

  get userOptions(): DsSelectOption[] {
    return [
      { value: '', label: 'Non assigné' },
      ...this.users.map(u => ({ value: u.id, label: u.name }))
    ];
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<any>,
    private taskApiService: TaskApiService,
    @Inject(DIALOG_DATA) public data: TaskFormData | null
  ) {
    this.isEditMode = !!data?.task;
    
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(1000)],
      assignedTo: [''],
      dueDate: [''],
      priority: [TaskPriority.MEDIUM, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    
    if (this.isEditMode && this.data?.task) {
      this.taskForm.patchValue({
        title: this.data.task.title,
        description: this.data.task.description || '',
        assignedTo: this.data.task.assignedTo || '',
        dueDate: this.data.task.dueDate || '',
        priority: this.data.task.priority
      });
    }
  }

  loadUsers(): void {
    this.taskApiService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.taskForm.valid && !this.loading) {
      this.loading = true;
      const formValue = this.taskForm.value;
      
      const request = {
        title: formValue.title,
        description: formValue.description || undefined,
        assignedTo: formValue.assignedTo || undefined,
        dueDate: formValue.dueDate || undefined,
        priority: formValue.priority
      };

      if (this.isEditMode && this.data?.task) {
        this.taskApiService.update(this.data.task.id, request).subscribe({
          next: (task) => {
            this.dialogRef.close(task);
          },
          error: (error) => {
            console.error('Error updating task:', error);
            this.loading = false;
          }
        });
      } else {
        this.taskApiService.create(request).subscribe({
          next: (task) => {
            this.dialogRef.close(task);
          },
          error: (error) => {
            console.error('Error creating task:', error);
            this.loading = false;
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get titleError(): string {
    const control = this.taskForm.get('title');
    if (control?.hasError('required')) {
      return 'Le titre est requis';
    }
    if (control?.hasError('maxlength')) {
      return 'Le titre est trop long (max 200)';
    }
    return '';
  }

  get descriptionError(): string {
    const control = this.taskForm.get('description');
    if (control?.hasError('maxlength')) {
      return 'La description est trop longue (max 1000)';
    }
    return '';
  }
}
