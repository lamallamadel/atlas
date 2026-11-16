import { Component, OnInit, OnDestroy, AfterViewChecked, ChangeDetectorRef, input, output, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageResponse, MessageDirection, MessageDeliveryStatus } from '../services/message-api.service';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';
import { 
  DsSkeletonComponent, 
  DsIconComponent, 
  DsButtonComponent, 
  DsToastService 
} from '../design-system';

export interface MessageAction {
  type: 'retry' | 'delete' | 'forward' | 'copy';
  message: MessageResponse;
}

@Component({
    selector: 'app-whatsapp-thread',
    standalone: true,
    templateUrl: './whatsapp-thread.component.html',
    styleUrls: ['./whatsapp-thread.component.scss'],
    imports: [
      CommonModule,
      DsIconComponent,
      DsButtonComponent,
      DsSkeletonComponent,
      CdkVirtualScrollViewport,
      CdkFixedSizeVirtualScroll,
      CdkVirtualForOf
    ],
})
export class WhatsappThreadComponent implements OnInit, OnDestroy, AfterViewChecked {
  private toastService = inject(DsToastService);
  private cdr = inject(ChangeDetectorRef);

  readonly messages = input<MessageResponse[]>([]);
  readonly loading = input(false);
  readonly isOnline = input(true);
  readonly messageAction = output<MessageAction>();

  readonly viewport = viewChild(CdkVirtualScrollViewport);

  MessageDirection = MessageDirection;
  MessageDeliveryStatus = MessageDeliveryStatus;
  Math = Math;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  swipedMessageId: number | null = null;
  swipeOffset = 0;
  isSwiping = false;
  startX = 0;

  ngOnInit(): void {
    this.shouldScrollToBottom = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.viewport()) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  scrollToBottom(): void {
    const viewport = this.viewport();
    if (viewport) {
      viewport.scrollToIndex(this.messages().length - 1, 'smooth');
    }
  }

  onTouchStart(event: TouchEvent, message: MessageResponse): void {
    if (message.direction !== MessageDirection.OUTBOUND) return;
    this.isSwiping = true;
    this.startX = event.touches[0].clientX;
    this.swipedMessageId = message.id;
  }

  onTouchMove(event: TouchEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) return;
    const currentX = event.touches[0].clientX;
    const diffX = currentX - this.startX;
    if (diffX < 0 && diffX > -150) {
      this.swipeOffset = diffX;
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) return;
    this.isSwiping = false;
    this.swipeOffset = 0;
    this.swipedMessageId = null;
  }

  retryMessage(message: MessageResponse, event?: Event): void {
    if (event) event.stopPropagation();
    this.messageAction.emit({ type: 'retry', message });
  }

  deleteMessage(message: MessageResponse, event?: Event): void {
    if (event) event.stopPropagation();
    this.messageAction.emit({ type: 'delete', message });
  }

  copyMessage(message: MessageResponse, event?: Event): void {
    if (event) event.stopPropagation();
    navigator.clipboard.writeText(message.content);
    this.toastService.success('Message copié');
    this.messageAction.emit({ type: 'copy', message });
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getDeliveryStatusIcon(status?: MessageDeliveryStatus): string {
    switch (status) {
      case MessageDeliveryStatus.PENDING: return 'clock';
      case MessageDeliveryStatus.SENT: return 'check';
      case MessageDeliveryStatus.DELIVERED: return 'check';
      case MessageDeliveryStatus.FAILED: return 'close';
      case MessageDeliveryStatus.READ: return 'check';
      default: return '';
    }
  }

  showDateDivider(index: number): boolean {
    if (index === 0) return true;
    return new Date(this.messages()[index].timestamp).toDateString() !== new Date(this.messages()[index - 1].timestamp).toDateString();
  }

  getDateDividerText(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  }

  getSwipeTransform(messageId: number): string {
    return (this.swipedMessageId === messageId && this.isSwiping) ? `translateX(${this.swipeOffset}px)` : 'translateX(0)';
  }

  trackByMessageId(index: number, message: MessageResponse): number { return message.id; }
}
