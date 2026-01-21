import { Component, Input, OnInit } from '@angular/core';
import { MessageResponse } from '../services/message-api.service';

/**
 * Example component demonstrating integration of WhatsappMessagingUiComponent
 * This shows how to use the messaging UI in a dossier detail page or any other context
 */
@Component({
  selector: 'app-whatsapp-messaging-ui-example',
  template: `
    <div class="messaging-example-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>chat</mat-icon>
            Conversation WhatsApp
          </mat-card-title>
          <mat-card-subtitle>
            Communication avec {{ contactName }}
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="messaging-wrapper">
            <app-whatsapp-messaging-ui
              [dossierId]="dossierId"
              [recipientPhone]="contactPhone"
              [recipientName]="contactName"
              (messageActionEvent)="handleMessageAction($event)">
            </app-whatsapp-messaging-ui>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .messaging-example-container {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }

    mat-card {
      margin-bottom: 16px;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .messaging-wrapper {
      height: 600px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .messaging-example-container {
        padding: 0;
      }

      mat-card {
        margin: 0;
        box-shadow: none;
        border-radius: 0;
      }

      .messaging-wrapper {
        height: calc(100vh - 200px);
        border: none;
        border-radius: 0;
      }
    }
  `]
})
export class WhatsappMessagingUiExampleComponent implements OnInit {
  @Input() dossierId!: number;
  @Input() contactPhone?: string;
  @Input() contactName?: string;

  ngOnInit(): void {
    if (!this.dossierId) {
      console.error('dossierId is required for WhatsappMessagingUiExampleComponent');
    }
  }

  handleMessageAction(event: { type: string; message: MessageResponse }): void {
    console.log('Message action triggered:', event.type);
    console.log('Message data:', event.message);

    switch (event.type) {
      case 'retry':
        console.log('Retrying message:', event.message.id);
        break;
      case 'copy':
        console.log('Message copied to clipboard');
        break;
      default:
        console.log('Unknown action:', event.type);
    }
  }
}

/**
 * Alternative: Dialog/Modal Implementation
 * Use this when you want the messaging UI in a dialog
 */
import { Component as DialogComponent, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface MessagingDialogData {
  dossierId: number;
  contactPhone?: string;
  contactName?: string;
}

@DialogComponent({
  selector: 'app-whatsapp-messaging-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon>chat</mat-icon>
      WhatsApp - {{ data.contactName || 'Contact' }}
    </h2>
    
    <mat-dialog-content class="messaging-dialog-content">
      <app-whatsapp-messaging-ui
        [dossierId]="data.dossierId"
        [recipientPhone]="data.contactPhone"
        [recipientName]="data.contactName"
        (messageActionEvent)="handleMessageAction($event)">
      </app-whatsapp-messaging-ui>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 16px 24px;
      background: #075e54;
      color: white;
    }

    .messaging-dialog-content {
      height: 600px;
      max-height: 80vh;
      padding: 0;
      margin: 0;
      overflow: hidden;
    }

    mat-dialog-actions {
      padding: 8px 16px;
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
    }

    @media (max-width: 768px) {
      .messaging-dialog-content {
        height: calc(100vh - 150px);
      }
    }
  `]
})
export class WhatsappMessagingDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<WhatsappMessagingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessagingDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  handleMessageAction(event: { type: string; message: MessageResponse }): void {
    console.log('Dialog - Message action:', event.type, event.message);
  }
}

/**
 * Service to open the messaging dialog
 */
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WhatsappMessagingDialogService {
  constructor(private dialog: MatDialog) {}

  openMessagingDialog(data: MessagingDialogData): Observable<void> {
    const dialogRef = this.dialog.open(WhatsappMessagingDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      height: '700px',
      maxHeight: '90vh',
      data,
      panelClass: 'whatsapp-messaging-dialog',
      disableClose: false
    });

    return dialogRef.afterClosed();
  }
}

/**
 * Usage example in a parent component:
 * 
 * // In component
 * constructor(private messagingDialogService: WhatsappMessagingDialogService) {}
 * 
 * openWhatsAppMessaging(dossierId: number, contactName: string, contactPhone: string): void {
 *   this.messagingDialogService.openMessagingDialog({
 *     dossierId,
 *     contactName,
 *     contactPhone
 *   }).subscribe(() => {
 *     console.log('Dialog closed');
 *   });
 * }
 * 
 * // In template
 * <button mat-raised-button color="primary" (click)="openWhatsAppMessaging(dossier.id, dossier.leadName, dossier.leadPhone)">
 *   <mat-icon>chat</mat-icon>
 *   Ouvrir WhatsApp
 * </button>
 */
