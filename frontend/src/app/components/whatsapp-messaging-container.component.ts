import { Component, OnInit, OnDestroy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageApiService, MessageResponse, MessageChannel, MessageDirection } from '../services/message-api.service';
import { WhatsappThreadComponent } from './whatsapp-thread.component';
import { WhatsappMessageInputComponent } from './whatsapp-message-input.component';
import { DsProgressBarComponent, DsToastService } from '../design-system';

@Component({
  selector: 'app-whatsapp-messaging-container',
  standalone: true,
  templateUrl: './whatsapp-messaging-container.component.html',
  styleUrls: ['./whatsapp-messaging-container.component.css'],
  imports: [
    CommonModule, 
    WhatsappThreadComponent,
    WhatsappMessageInputComponent,
    DsProgressBarComponent
  ]
})
export class WhatsappMessagingContainerComponent implements OnInit, OnDestroy {
  private messageApiService = inject(MessageApiService);
  private toastService = inject(DsToastService);

  readonly dossierId = input.required<number>();
  readonly consentGranted = input<boolean>(false);
  readonly leadName = input<string>('');
  readonly templates = input<any[]>([]);

  messages: MessageResponse[] = [];
  isSyncing = false;
  loading = false;
  sending = false;
  isOnline = true;
  queuedMessagesCount = 0;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadMessages();
    
    // Poll for new messages every 10 seconds
    interval(10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncMessages();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMessages(): void {
    this.loading = true;
    this.messageApiService.list({ 
      dossierId: this.dossierId(), 
      channel: MessageChannel.WHATSAPP, 
      size: 50, 
      sort: 'timestamp,desc' 
    })
    .subscribe({
      next: (response) => {
        this.messages = response.content;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading WhatsApp messages:', err);
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des messages');
      }
    });
  }

  syncMessages(): void {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    this.messageApiService.list({ 
      dossierId: this.dossierId(), 
      channel: MessageChannel.WHATSAPP, 
      size: 20, 
      sort: 'timestamp,desc' 
    })
    .subscribe({
      next: (response) => {
        const existingIds = new Set(this.messages.map(m => m.id));
        const newMessages = response.content.filter(m => !existingIds.has(m.id));
        
        if (newMessages.length > 0) {
          this.messages = [...newMessages, ...this.messages];
        }
        this.isSyncing = false;
      },
      error: () => {
        this.isSyncing = false;
      }
    });
  }

  onMessageAction(event: any): void {
    // Basic implementation for message actions
    if (event.action === 'retry') {
      this.onSendMessage(event.message);
    }
  }

  getEnrichedTemplates(): any[] {
    return this.templates().map(t => ({
      ...t,
      content: t.content.replace('{{name}}', this.leadName())
    }));
  }

  onSendMessage(event: any): void {
    this.sending = true;
    this.messageApiService.create({
      dossierId: this.dossierId(),
      channel: MessageChannel.WHATSAPP,
      direction: MessageDirection.OUTBOUND,
      content: event.content,
      timestamp: new Date().toISOString(),
      templateId: event.templateId,
      templateVariables: event.templateVariables
    }).subscribe({
      next: (m) => {
        this.messages = [...this.messages, m];
        this.sending = false;
      },
      error: () => {
        this.sending = false;
        this.toastService.error('Échec de l\'envoi');
      }
    });
  }
}
