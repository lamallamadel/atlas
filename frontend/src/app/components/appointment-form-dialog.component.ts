import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppointmentStatus } from '../services/appointment-api.service';

export interface AppointmentFormData {
  id?: number;
  dossierId: number;
  startTime?: string;
  endTime?: string;
  location?: string;
  assignedTo?: string;
  notes?: string;
  status?: AppointmentStatus;
}

@Component({
  selector: 'app-appointment-form-dialog',
  templateUrl: './appointment-form-dialog.component.html',
  styleUrls: ['./appointment-form-dialog.component.css']
})
export class AppointmentFormDialogComponent implements OnInit {
  appointmentForm!: FormGroup;
  isEditMode = false;
  AppointmentStatus = AppointmentStatus;

  statusOptions = [
    { value: AppointmentStatus.SCHEDULED, label: 'Planifié' },
    { value: AppointmentStatus.COMPLETED, label: 'Terminé' },
    { value: AppointmentStatus.CANCELLED, label: 'Annulé' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AppointmentFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentFormData
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!(this.data?.id);
    
    this.appointmentForm = this.fb.group({
      startTime: [this.data?.startTime || '', Validators.required],
      endTime: [this.data?.endTime || '', Validators.required],
      location: [this.data?.location || ''],
      assignedTo: [this.data?.assignedTo || ''],
      notes: [this.data?.notes || ''],
      status: [this.data?.status || AppointmentStatus.SCHEDULED, Validators.required]
    }, { validators: this.timeRangeValidator });
  }

  timeRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const startTime = group.get('startTime')?.value;
    const endTime = group.get('endTime')?.value;
    
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        return { invalidTimeRange: true };
      }
    }
    
    return null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      const formValue = this.appointmentForm.value;
      this.dialogRef.close({
        id: this.data?.id,
        dossierId: this.data.dossierId,
        ...formValue
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.appointmentForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    return '';
  }

  getFormErrorMessage(): string {
    if (this.appointmentForm.hasError('invalidTimeRange')) {
      return 'L\'heure de début doit être antérieure à l\'heure de fin';
    }
    return '';
  }
}
