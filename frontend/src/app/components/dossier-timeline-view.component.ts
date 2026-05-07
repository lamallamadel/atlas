import { Component, Input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CustomerPortalActivity } from '../models/customer-portal.models';
import { TimelineComponent, type DsTimelineEvent } from '../design-system';

@Component({
  selector: 'app-dossier-timeline-view',
  standalone: true,
  imports: [CommonModule, TimelineComponent],
  providers: [DatePipe],
  templateUrl: './dossier-timeline-view.component.html',
  styleUrls: ['./dossier-timeline-view.component.scss'],
})
export class DossierTimelineViewComponent {
  @Input() activities: CustomerPortalActivity[] = [];

  private readonly datePipe = inject(DatePipe);

  get timelineEvents(): DsTimelineEvent[] {
    const list = this.activities ?? [];
    return list.map((activity, index) => ({
      date: activity.createdAt,
      dateDisplay:
        this.datePipe.transform(activity.createdAt, 'short', undefined, 'fr-FR') ?? activity.createdAt,
      title: activity.friendlyDescription,
      description: activity.content?.trim() ? activity.content : undefined,
      variant: index % 2 === 0 ? 'copper' : 'marine',
    }));
  }
}
