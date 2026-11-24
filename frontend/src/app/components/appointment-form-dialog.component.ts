import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AppointmentStatus } from '../services/appointment-api.service';
import { DatetimePickerComponent } from './datetime-picker.component';
import { CommonModule } from '@angular/common';
import {
  DsSelectComponent,
  DsSelectOption,
  DsButtonComponent,
  DsIconComponent,
  DsCardComponent,
  DsInputComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

export interface AppointmentFormData {
  id?: number;
  dossierId: number;
  startTime?: string;
  endTime?: string;
  location?: string;
  assignedTo?: string;
  notes?: string;
  status?: AppointmentStatus;
  locale?: string;
}

@Component({
    selector: 'app-appointment-form-dialog',
    standalone: true,
    templateUrl: './appointment-form-dialog.component.html',
    styleUrls: ['./appointment-form-dialog.component.css'],
    imports: [
      CommonModule,
      FormsModule, 
      ReactiveFormsModule, 
      DatetimePickerComponent, 
      DsSelectComponent,
      DsButtonComponent,
      DsIconComponent,
      DsCardComponent,
      DsInputComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class AppointmentFormDialogComponent implements OnInit {
  appointmentForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  AppointmentStatus = AppointmentStatus;

  statusOptions: DsSelectOption[] = [
    { value: AppointmentStatus.SCHEDULED, label: 'Planifié' },
    { value: AppointmentStatus.COMPLETED, label: 'Terminé' },
    { value: AppointmentStatus.CANCELLED, label: 'Annulé' }
  ];

  localeOptions: DsSelectOption[] = [
    { value: 'fr_FR', label: 'Français (France)' },
    { value: 'en_US', label: 'English (US)' },
    { value: 'ar_MA', label: 'العربية (المغرب)' },
    { value: 'es_ES', label: 'Español (España)' },
    { value: 'de_DE', label: 'Deutsch (Deutschland)' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<AppointmentFormData>,
    @Inject(DIALOG_DATA) public data: AppointmentFormData
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!(this.data?.id);
    
    this.appointmentForm = this.fb.group({
      startTime: [this.data?.startTime || '', Validators.required],
      endTime: [this.data?.endTime || '', Validators.required],
      location: [this.data?.location || ''],
      assignedTo: [this.data?.assignedTo || ''],
      notes: [this.data?.notes || ''],
      status: [this.data?.status || AppointmentStatus.SCHEDULED, Validators.required],
      locale: [this.data?.locale || 'fr_FR']
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
    if (this.appointmentForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
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
