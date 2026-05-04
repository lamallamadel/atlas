import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DsTimelineEvent {
  date: string;
  title: string;
  description?: string;
  variant?: 'marine' | 'copper' | 'muted';
}

@Component({
  selector: 'ds-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ol class="ds-timeline" aria-label="Chronologie">
      @for (event of events; track event.date + event.title) {
        <li class="ds-timeline__event" [class]="'ds-timeline__event--' + (event.variant ?? 'copper')">
          <time class="ds-timeline__date" [attr.datetime]="event.date">{{ event.date }}</time>
          <div class="ds-timeline__content">
            <div class="ds-timeline__title">{{ event.title }}</div>
            @if (event.description) {
              <div class="ds-timeline__desc">{{ event.description }}</div>
            }
          </div>
        </li>
      }
    </ol>
  `,
  styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent {
  @Input() events: DsTimelineEvent[] = [];
}
