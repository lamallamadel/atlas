import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageApiService, MessageChannel, MessageDirection, MessageResponse, MessageCreateRequest } from '../services/message-api.service';
import { OfflineMessageQueueService } from '../services/offline-message-queue.service';
import { WhatsAppTemplate } from './whatsapp-message-input.component';
import { MessageAction } from './whatsapp-thread.component';

@Component({
  selector: 'app-whatsapp-messaging-container',
  templateUrl: './whatsapp-messaging-container.component.html',
  styleUrls: ['./whatsapp-messaging-container.component.css']
})
export class WhatsappMessagingContainerComponent implements OnInit, OnDestroy {
  @Input() dossierId!: number;
  @Input() consentGranted = false;
  @Input() leadName?: string;
  @Input() templates: WhatsAppTemplate[] = [];

  messages: MessageResponse[] = [];
  loading = false;
  sending = false;
  isOnline = true;
  queuedMessagesCount = 0;
  isSyncing = false;

  private destroy$ = new Subject<void>();

  constructor(
    private messageApiService: MessageApiService,
    private offlineQueueService: OfflineMessageQueueService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMessages();
    this.setupQueueMonitoring();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupQueueMonitoring(): void {
    this.offlineQueueService.isOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOnline => {
        this.isOnline = isOnline;
        if (isOnline) {
          this.showOnlineNotification();
        } else {
          this.showOfflineNotification();
        }
      });

    this.offlineQueueService.queueCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.queuedMessagesCount = count;
      });

    this.offlineQueueService.isSyncing$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isSyncing => {
        this.isSyncing = isSyncing;
        if (isSyncing) {
          this.showSyncingNotification();
        }
      });
  }

  loadMessages(): void {
    if (!this.dossierId) {
      return;
    }

    this.loading = true;
    this.messageApiService.list({
      dossierId: this.dossierId,
      channel: MessageChannel.WHATSAPP,
      size: 100,
      sort: 'timestamp,asc'
    }).subscribe({
      next: (response) => {
        this.messages = response.content;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading WhatsApp messages:', err);
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement des messages', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  onSendMessage(event: { content: string; templateId?: string; templateVariables?: Record<string, string> }): void {
    if (!this.consentGranted) {
      this.snackBar.open(
        '⚠️ Le consentement WhatsApp n\'est pas accordé',
        'Fermer',
        {
          duration: 5000,
          panelClass: ['warning-snackbar']
        }
      );
      return;
    }

    this.sending = true;

    const request: MessageCreateRequest = {
      dossierId: this.dossierId,
      channel: MessageChannel.WHATSAPP,
      direction: MessageDirection.OUTBOUND,
      content: event.content,
      timestamp: new Date().toISOString(),
      templateId: event.templateId,
      templateVariables: event.templateVariables
    };

    this.offlineQueueService.enqueue(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newMessage) => {
          this.sending = false;
          if (newMessage) {
            this.messages.push(newMessage);
            this.snackBar.open('Message envoyé', 'Fermer', {
              duration: 2000,
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open('Message mis en file d\'attente', 'Fermer', {
              duration: 2000,
              panelClass: ['info-snackbar']
            });
          }
        },
        error: (err) => {
          this.sending = false;
          const errorMessage = err.error?.message || 'Échec de l\'envoi du message';
          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          console.error('Error sending message:', err);
        }
      });
  }

  onMessageAction(action: MessageAction): void {
    switch (action.type) {
      case 'retry':
        this.retryMessage(action.message);
        break;
      case 'delete':
        this.deleteMessage(action.message);
        break;
      case 'copy':
        this.snackBar.open('Message copié', 'Fermer', {
          duration: 2000
        });
        break;
    }
  }

  private retryMessage(message: MessageResponse): void {
    this.messageApiService.retry(message.id).subscribe({
      next: (updatedMessage) => {
        const index = this.messages.findIndex(m => m.id === message.id);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
        }
        this.snackBar.open('Message en cours de renvoi...', 'Fermer', {
          duration: 2000
        });
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec du renvoi du message';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        console.error('Error retrying message:', err);
      }
    });
  }

  private deleteMessage(_message: MessageResponse): void {
    this.snackBar.open('Fonctionnalité de suppression à venir', 'Fermer', {
      duration: 2000
    });
  }

  private showOnlineNotification(): void {
    this.snackBar.open('✓ Connexion rétablie', 'Fermer', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  private showOfflineNotification(): void {
    this.snackBar.open('⚠️ Mode hors ligne - Messages mis en file d\'attente', 'Fermer', {
      duration: 3000,
      panelClass: ['warning-snackbar']
    });
  }

  private showSyncingNotification(): void {
    this.snackBar.open('🔄 Synchronisation des messages...', 'Fermer', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }

  getEnrichedTemplates(): WhatsAppTemplate[] {
    if (!this.leadName) {
      return this.templates;
    }

    return this.templates.map(template => {
      const enrichedVariables = { ...template };
      return enrichedVariables;
    });
  }
}
