import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsAvatarComponent } from '../../primitives/ds-avatar/ds-avatar.component';

export interface DsMessage {
  id: string | number;
  content: string;
  direction: 'inbound' | 'outbound';
  senderName?: string;
  time?: string;
  status?: 'sent' | 'delivered' | 'read' | 'error';
}

@Component({
  selector: 'ds-messaging-thread',
  standalone: true,
  imports: [CommonModule, DsAvatarComponent],
  template: `
    <div class="ds-thread" role="log" [attr.aria-label]="ariaLabel" aria-live="polite">
      @for (msg of messages; track msg.id) {
        <div class="ds-thread__msg" [class]="'ds-thread__msg--' + msg.direction">
          @if (msg.direction === 'inbound' && showAvatars) {
            <ds-avatar [name]="msg.senderName || '?'" size="sm" class="ds-thread__avatar"></ds-avatar>
          }
          <div class="ds-thread__bubble">
            <p class="ds-thread__text">{{ msg.content }}</p>
            @if (msg.time) {
              <time class="ds-thread__time">{{ msg.time }}</time>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./messaging-thread.component.scss'],
})
export class MessagingThreadComponent {
  @Input() messages: DsMessage[] = [];
  @Input() showAvatars = true;
  @Input() ariaLabel = 'Messages';
}
