import { Component, OnInit, input, inject } from '@angular/core';
import { OutboundMessageApiService, OutboundMessageResponse } from '../../services/outbound-message-api.service';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';
import { OutboundMessageFormComponent } from './outbound-message-form.component';
import { OutboundMessageListComponent } from './outbound-message-list.component';
import { DsToastService, DsDialogService } from '../../design-system';

@Component({
    selector: 'app-messaging-tab',
    standalone: true,
    templateUrl: './messaging-tab.component.html',
    styleUrls: ['./messaging-tab.component.css'],
    imports: [OutboundMessageFormComponent, OutboundMessageListComponent]
})
export class MessagingTabComponent implements OnInit {
  readonly dossierId = input.required<number>();
  readonly recipientPhone = input<string>();
  readonly leadName = input<string>();

  private outboundMessageService = inject(OutboundMessageApiService);
  private dsDialogService = inject(DsDialogService);
  private toastService = inject(DsToastService);

  ngOnInit(): void {
    if (!this.dossierId()) {
      console.error('MessagingTabComponent: dossierId is required');
    }
  }

  onMessageSent(): void {
    this.toastService.success('Message envoyé avec succès');
  }

  onRetryMessage(message: OutboundMessageResponse): void {
    const dialogRef = this.dsDialogService.open<boolean>(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Réessayer l\'envoi',
        message: `Voulez-vous vraiment réessayer d'envoyer ce message à ${message.recipientPhone} ?`
      }
    });

    dialogRef.closed.subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        this.retryMessageConfirmed(message);
      }
    });
  }

  private retryMessageConfirmed(message: OutboundMessageResponse): void {
    this.outboundMessageService.retry(message.id).subscribe({
      next: () => {
        this.toastService.info('Message en cours de renvoi...');
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec du renvoi du message';
        this.toastService.error(errorMessage);
        console.error('Error retrying message:', err);
      }
    });
  }
}
