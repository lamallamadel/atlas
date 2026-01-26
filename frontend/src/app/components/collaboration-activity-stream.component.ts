import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CollaborationService, CollaborationActivity } from '../services/collaboration.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-collaboration-activity-stream',
  template: `
    <div class="activity-stream">
      <h3 class="activity-header">
        <span class="header-icon">📋</span>
        Real-time Activity Stream
        <span *ngIf="showNewActivityBadge" class="new-badge">NEW</span>
      </h3>
      <div class="activity-list">
        <div *ngFor="let activity of activities; let i = index" 
             class="activity-item"
             [class.new-activity]="i === 0 && showNewActivityAnimation">
          <div class="activity-avatar" [style.background-color]="getActivityColor(activity.activityType)">
            {{ getActivityIcon(activity.activityType) }}
          </div>
          <div class="activity-content">
            <div class="activity-description">
              <strong>{{ activity.username }}</strong> {{ activity.description }}
            </div>
            <div class="activity-timestamp">{{ formatTimestamp(activity.timestamp) }}</div>
          </div>
        </div>
        <div *ngIf="activities.length === 0" class="no-activities">
          <span class="empty-icon">🔔</span>
          <p>No recent activity</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .activity-stream {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .activity-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .header-icon {
      font-size: 20px;
    }

    .new-badge {
      background: #ff4444;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: 700;
      animation: pulse 1s infinite;
    }

    .activity-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 8px;
      transition: background 0.2s;
    }

    .activity-item:hover {
      background: #f5f5f5;
    }

    .activity-item.new-activity {
      animation: slideIn 0.5s ease-out;
      background: #e3f2fd;
    }

    .activity-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 18px;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-description {
      font-size: 14px;
      color: #333;
      margin-bottom: 4px;
      word-wrap: break-word;
    }

    .activity-timestamp {
      font-size: 12px;
      color: #666;
    }

    .no-activities {
      text-align: center;
      padding: 32px;
      color: #999;
    }

    .empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 8px;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
  `]
})
export class CollaborationActivityStreamComponent implements OnInit, OnDestroy {
  @Input() dossierId!: number;
  @Input() maxActivities = 20;

  activities: CollaborationActivity[] = [];
  showNewActivityBadge = false;
  showNewActivityAnimation = false;

  private subscriptions: Subscription[] = [];
  private badgeTimeout: any;

  constructor(private collaborationService: CollaborationService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.collaborationService.getActivityUpdates().subscribe(activity => {
        this.addActivity(activity);
      })
    );
  }

  private addActivity(activity: CollaborationActivity): void {
    this.activities.unshift(activity);
    
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }

    this.showNewActivityBadge = true;
    this.showNewActivityAnimation = true;

    setTimeout(() => {
      this.showNewActivityAnimation = false;
    }, 500);

    if (this.badgeTimeout) {
      clearTimeout(this.badgeTimeout);
    }

    this.badgeTimeout = setTimeout(() => {
      this.showNewActivityBadge = false;
    }, 3000);
  }

  getActivityIcon(activityType: string): string {
    const icons: { [key: string]: string } = {
      'edit': '✏️',
      'status_change': '🔄',
      'comment': '💬',
      'appointment': '📅',
      'message': '📧',
      'document': '📄',
      'task': '✅',
      'note': '📝'
    };
    return icons[activityType] || '📋';
  }

  getActivityColor(activityType: string): string {
    const colors: { [key: string]: string } = {
      'edit': '#2196f3',
      'status_change': '#ff9800',
      'comment': '#4caf50',
      'appointment': '#9c27b0',
      'message': '#00bcd4',
      'document': '#795548',
      'task': '#8bc34a',
      'note': '#607d8b'
    };
    return colors[activityType] || '#666';
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days < 7) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.badgeTimeout) {
      clearTimeout(this.badgeTimeout);
    }
  }
}
