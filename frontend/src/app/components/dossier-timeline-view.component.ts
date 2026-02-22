import { Component, Input } from '@angular/core';
import { CustomerPortalActivity } from '../models/customer-portal.models';

@Component({
  selector: 'app-dossier-timeline-view',
  template: `
    <div class="timeline-container">
      <h2>Historique de votre dossier</h2>
      
      <div *ngIf="!activities || activities.length === 0" class="empty-state">
        <p>Aucune activité pour le moment</p>
      </div>

      <div class="timeline">
        <div *ngFor="let activity of activities" class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="activity-header">
              <span class="activity-type">{{ activity.friendlyDescription }}</span>
              <span class="activity-date">{{ activity.createdAt | date:'short' }}</span>
            </div>
            <div class="activity-body" *ngIf="activity.content">
              {{ activity.content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 24px 0;
      font-size: 20px;
      color: #333;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #999;
    }

    .timeline {
      position: relative;
      padding-left: 40px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 24px;
    }

    .timeline-marker {
      position: absolute;
      left: -36px;
      top: 4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #667eea;
      border: 3px solid white;
      box-shadow: 0 0 0 2px #667eea;
    }

    .timeline-content {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .activity-type {
      font-weight: 600;
      color: #333;
    }

    .activity-date {
      font-size: 14px;
      color: #999;
    }

    .activity-body {
      color: #666;
      line-height: 1.5;
    }
  `]
})
export class DossierTimelineViewComponent {
  @Input() activities: CustomerPortalActivity[] = [];
}
