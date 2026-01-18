import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { MessageResponse, MessageDirection, MessageDeliveryStatus } from '../services/message-api.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';

export interface MessageAction {
  type: 'retry' | 'delete' | 'forward' | 'copy';
  message: MessageResponse;
}

@Component({
  selector: 'app-whatsapp-thread',
  templateUrl: './whatsapp-thread.component.html',
  styleUrls: ['./whatsapp-thread.component.css']
})
export class WhatsappThreadComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() messages: MessageResponse[] = [];
  @Input() loading = false;
  @Input() isOnline = true;
  @Output() messageAction = new EventEmitter<MessageAction>();

  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;

  MessageDirection = MessageDirection;
  MessageDeliveryStatus = MessageDeliveryStatus;
  Math = Math;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  swipedMessageId: number | null = null;
  swipeOffset = 0;
  isSwiping = false;
  startX = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.shouldScrollToBottom = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.viewport) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  scrollToBottom(): void {
    if (this.viewport) {
      this.viewport.scrollToIndex(this.messages.length - 1, 'smooth');
    }
  }

  onTouchStart(event: TouchEvent, message: MessageResponse): void {
    if (message.direction !== MessageDirection.OUTBOUND) {
      return;
    }

    this.isSwiping = true;
    this.startX = event.touches[0].clientX;
    this.swipedMessageId = message.id;
  }

  onTouchMove(event: TouchEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) {
      return;
    }

    const currentX = event.touches[0].clientX;
    const diffX = currentX - this.startX;

    if (diffX < 0 && diffX > -150) {
      this.swipeOffset = diffX;
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) {
      return;
    }

    this.isSwiping = false;

    if (Math.abs(this.swipeOffset) > 75) {
      // Actions are shown via CSS when swiped
    }

    this.swipeOffset = 0;
    this.swipedMessageId = null;
  }

  onMouseDown(event: MouseEvent, message: MessageResponse): void {
    if (message.direction !== MessageDirection.OUTBOUND) {
      return;
    }

    this.isSwiping = true;
    this.startX = event.clientX;
    this.swipedMessageId = message.id;
  }

  onMouseMove(event: MouseEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) {
      return;
    }

    const currentX = event.clientX;
    const diffX = currentX - this.startX;

    if (diffX < 0 && diffX > -150) {
      this.swipeOffset = diffX;
      event.preventDefault();
    }
  }

  onMouseUp(event: MouseEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) {
      return;
    }

    this.isSwiping = false;

    if (Math.abs(this.swipeOffset) > 75) {
      // Actions are shown via CSS when swiped
    }

    this.swipeOffset = 0;
    this.swipedMessageId = null;
  }

  retryMessage(message: MessageResponse, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.messageAction.emit({ type: 'retry', message });
  }

  deleteMessage(message: MessageResponse, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.messageAction.emit({ type: 'delete', message });
  }

  copyMessage(message: MessageResponse, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    navigator.clipboard.writeText(message.content);
    this.messageAction.emit({ type: 'copy', message });
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
      return `${diffMins} min`;
    } else if (diffHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }

  getDeliveryStatusIcon(status?: MessageDeliveryStatus): string {
    switch (status) {
      case MessageDeliveryStatus.PENDING: return '⏳';
      case MessageDeliveryStatus.SENT: return '✓';
      case MessageDeliveryStatus.DELIVERED: return '✓✓';
      case MessageDeliveryStatus.FAILED: return '✗';
      case MessageDeliveryStatus.READ: return '✓✓';
      default: return '';
    }
  }

  getDeliveryStatusClass(status?: MessageDeliveryStatus): string {
    switch (status) {
      case MessageDeliveryStatus.PENDING: return 'status-pending';
      case MessageDeliveryStatus.SENT: return 'status-sent';
      case MessageDeliveryStatus.DELIVERED: return 'status-delivered';
      case MessageDeliveryStatus.FAILED: return 'status-failed';
      case MessageDeliveryStatus.READ: return 'status-read';
      default: return '';
    }
  }

  showDateDivider(index: number): boolean {
    if (index === 0) {
      return true;
    }

    const currentDate = new Date(this.messages[index].timestamp);
    const previousDate = new Date(this.messages[index - 1].timestamp);

    return currentDate.toDateString() !== previousDate.toDateString();
  }

  getDateDividerText(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  getSwipeTransform(messageId: number): string {
    if (this.swipedMessageId === messageId && this.isSwiping) {
      return `translateX(${this.swipeOffset}px)`;
    }
    return 'translateX(0)';
  }

  trackByMessageId(index: number, message: MessageResponse): number {
    return message.id;
  }
}
