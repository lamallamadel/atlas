import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageChannel, MessageDirection } from '../services/message-api.service';

export interface MessageFormData {
  dossierId: number;
}

@Component({
  selector: 'app-message-form-dialog',
  templateUrl: './message-form-dialog.component.html',
  styleUrls: ['./message-form-dialog.component.css']
})
export class MessageFormDialogComponent implements OnInit {
  messageForm!: FormGroup;
  MessageChannel = MessageChannel;
  MessageDirection = MessageDirection;

  channelOptions = [
    { value: MessageChannel.EMAIL, label: 'EMAIL' },
    { value: MessageChannel.SMS, label: 'SMS' },
    { value: MessageChannel.PHONE, label: 'PHONE' },
    { value: MessageChannel.WHATSAPP, label: 'WHATSAPP' },
    { value: MessageChannel.CHAT, label: 'CHAT' },
    { value: MessageChannel.IN_APP, label: 'IN_APP' }
  ];

  directionOptions = [
    { value: MessageDirection.INBOUND, label: 'Entrant' },
    { value: MessageDirection.OUTBOUND, label: 'Sortant' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MessageFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessageFormData
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
    if (this.messageForm.valid) {
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
