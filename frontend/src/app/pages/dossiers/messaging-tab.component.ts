import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OutboundMessageApiService, OutboundMessageResponse } from '../../services/outbound-message-api.service';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';

@Component({
  selector: 'app-messaging-tab',
  templateUrl: './messaging-tab.component.html',
  styleUrls: ['./messaging-tab.component.css']
})
export class MessagingTabComponent implements OnInit {
  @Input() dossierId!: number;
  @Input() recipientPhone?: string;
  @Input() leadName?: string;

  constructor(
    private outboundMessageService: OutboundMessageApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (!this.dossierId) {
      console.error('MessagingTabComponent: dossierId is required');
    }
  }

  onMessageSent(): void {
    this.snackBar.open('Message envoyé avec succès', 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  onRetryMessage(message: OutboundMessageResponse): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      data: {
        title: 'Réessayer l\'envoi',
        message: `Voulez-vous vraiment réessayer d'envoyer ce message à ${message.recipientPhone} ?`
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.retryMessageConfirmed(message);
      }
    });
  }

  private retryMessageConfirmed(message: OutboundMessageResponse): void {
    this.outboundMessageService.retry(message.id).subscribe({
      next: () => {
        this.snackBar.open('Message en cours de renvoi...', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec du renvoi du message';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error retrying message:', err);
      }
    });
  }
}
