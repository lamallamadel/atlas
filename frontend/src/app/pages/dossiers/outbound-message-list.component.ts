import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OutboundMessageApiService, OutboundMessageResponse, OutboundMessageStatus } from '../../services/outbound-message-api.service';

@Component({
  selector: 'app-outbound-message-list',
  templateUrl: './outbound-message-list.component.html',
  styleUrls: ['./outbound-message-list.component.css']
})
export class OutboundMessageListComponent implements OnInit, OnDestroy {
  @Input() dossierId!: number;
  @Output() retryMessage = new EventEmitter<OutboundMessageResponse>();

  messages: OutboundMessageResponse[] = [];
  loading = false;
  error: string | null = null;
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 5000;

  OutboundMessageStatus = OutboundMessageStatus;

  constructor(private outboundMessageService: OutboundMessageApiService) {}

  ngOnInit(): void {
    this.loadMessages();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadMessages(): void {
    if (!this.dossierId) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.outboundMessageService.list({
      dossierId: this.dossierId,
      size: 100,
      sort: 'createdAt,desc'
    }).subscribe({
      next: (response) => {
        this.messages = response.content;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Échec du chargement des messages';
        this.loading = false;
        console.error('Error loading outbound messages:', err);
      }
    });
  }

  startPolling(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        switchMap(() => this.outboundMessageService.list({
          dossierId: this.dossierId,
          size: 100,
          sort: 'createdAt,desc'
        }))
      )
      .subscribe({
        next: (response) => {
          this.messages = response.content;
        },
        error: (err) => {
          console.error('Error polling outbound messages:', err);
        }
      });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  onRetry(message: OutboundMessageResponse): void {
    this.retryMessage.emit(message);
  }

  getStatusBadgeClass(status: OutboundMessageStatus): string {
    switch (status) {
      case OutboundMessageStatus.QUEUED:
        return 'status-badge status-queued';
      case OutboundMessageStatus.SENDING:
        return 'status-badge status-sending';
      case OutboundMessageStatus.SENT:
        return 'status-badge status-sent';
      case OutboundMessageStatus.FAILED:
        return 'status-badge status-failed';
      default:
        return 'status-badge';
    }
  }

  getStatusLabel(status: OutboundMessageStatus): string {
    switch (status) {
      case OutboundMessageStatus.QUEUED:
        return 'En attente';
      case OutboundMessageStatus.SENDING:
        return 'Envoi en cours';
      case OutboundMessageStatus.SENT:
        return 'Envoyé';
      case OutboundMessageStatus.FAILED:
        return 'Échec';
      default:
        return status;
    }
  }

  getStatusIcon(status: OutboundMessageStatus): string {
    switch (status) {
      case OutboundMessageStatus.QUEUED:
        return '⏳';
      case OutboundMessageStatus.SENDING:
        return '📤';
      case OutboundMessageStatus.SENT:
        return '✓';
      case OutboundMessageStatus.FAILED:
        return '✗';
      default:
        return '';
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  canRetry(message: OutboundMessageResponse): boolean {
    return message.status === OutboundMessageStatus.FAILED;
  }
}
