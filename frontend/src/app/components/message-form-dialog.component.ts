import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { MessageChannel, MessageDirection } from '../services/message-api.service';
import { CommonModule } from '@angular/common';
import { DatetimePickerComponent } from './datetime-picker.component';
import {
  DsSelectComponent,
  DsSelectOption,
  DsButtonComponent,
  DsIconComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

export interface MessageFormData {
  dossierId: number;
}

@Component({
    selector: 'app-message-form-dialog',
    standalone: true,
    templateUrl: './message-form-dialog.component.html',
    styleUrls: ['./message-form-dialog.component.css'],
    imports: [
      CommonModule,
      FormsModule, 
      ReactiveFormsModule, 
      DatetimePickerComponent, 
      DsSelectComponent,
      DsButtonComponent,
      DsIconComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class MessageFormDialogComponent implements OnInit {
  messageForm!: FormGroup;
  isSubmitting = false;
  MessageChannel = MessageChannel;
  MessageDirection = MessageDirection;

  readonly channelOptions: DsSelectOption[] = [
    { value: MessageChannel.EMAIL, label: 'Email' },
    { value: MessageChannel.SMS, label: 'SMS' },
    { value: MessageChannel.PHONE, label: 'Téléphone' },
    { value: MessageChannel.WHATSAPP, label: 'WhatsApp' },
    { value: MessageChannel.CHAT, label: 'Chat' },
    { value: MessageChannel.IN_APP, label: 'In-app' }
  ];

  readonly directionOptions: DsSelectOption[] = [
    { value: MessageDirection.INBOUND, label: 'Entrant' },
    { value: MessageDirection.OUTBOUND, label: 'Sortant' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) public data: MessageFormData
  ) {}

  ngOnInit(): void {
    const now = new Date();
    const formattedDate = this.formatDateForInput(now);
    
    this.messageForm = this.fb.group({
      channel: [MessageChannel.EMAIL, Validators.required],
      direction: [MessageDirection.INBOUND, Validators.required],
      content: ['', Validators.required],
      timestamp: [formattedDate, Validators.required]
    });
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.messageForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.messageForm.value;
      const timestamp = new Date(formValue.timestamp).toISOString();
      
      this.dialogRef.close({
        dossierId: this.data.dossierId,
        channel: formValue.channel,
        direction: formValue.direction,
        content: formValue.content,
        timestamp: timestamp
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.messageForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    return '';
  }
}
