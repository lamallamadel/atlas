import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TaskApiService, TaskResponse, TaskPriority, User } from '../services/task-api.service';

@Component({
  selector: 'app-task-form-dialog',
  templateUrl: './task-form-dialog.component.html',
  styleUrls: ['./task-form-dialog.component.css']
})
export class TaskFormDialogComponent implements OnInit {
  taskForm: FormGroup;
  users: User[] = [];
  priorities = [
    { value: TaskPriority.HIGH, label: 'High' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.LOW, label: 'Low' }
  ];
  isEditMode = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskFormDialogComponent>,
    private taskApiService: TaskApiService,
    @Inject(MAT_DIALOG_DATA) public data: { task?: TaskResponse }
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
    
    if (this.isEditMode && this.data.task) {
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

      if (this.isEditMode && this.data.task) {
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
      return 'Title is required';
    }
    if (control?.hasError('maxlength')) {
      return 'Title must be at most 200 characters';
    }
    return '';
  }

  get descriptionError(): string {
    const control = this.taskForm.get('description');
    if (control?.hasError('maxlength')) {
      return 'Description must be at most 1000 characters';
    }
    return '';
  }
}
