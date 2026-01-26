import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CollaborationService, CollaborationPresence } from '../services/collaboration.service';
import { Subscription } from 'rxjs';

interface ViewerInfo {
  userId: string;
  username: string;
  color: string;
  initials: string;
}

@Component({
  selector: 'app-collaboration-presence',
  template: `
    <div class="collaboration-presence">
      <div class="viewers-container">
        <div class="viewer-avatars">
          <div *ngFor="let viewer of viewers" 
               class="viewer-avatar"
               [style.background-color]="viewer.color"
               [title]="viewer.username">
            {{ viewer.initials }}
          </div>
          <div *ngIf="viewerCount > maxVisibleViewers" 
               class="viewer-count"
               [title]="getExtraViewersTooltip()">
            +{{ viewerCount - maxVisibleViewers }}
          </div>
        </div>
        <span class="viewer-text">
          {{ viewerCount }} {{ viewerCount === 1 ? 'viewer' : 'viewers' }}
        </span>
      </div>
      <div *ngIf="recentActivity" class="recent-activity">
        <span class="activity-indicator" [class.pulse]="showActivityPulse"></span>
        <span class="activity-text">{{ recentActivity }}</span>
      </div>
    </div>
  `,
  styles: [`
    .collaboration-presence {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 8px;
      font-size: 14px;
    }

    .viewers-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .viewer-avatars {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .viewer-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }

    .viewer-avatar:hover {
      transform: scale(1.1);
    }

    .viewer-count {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #666;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .viewer-text {
      color: #666;
      font-weight: 500;
    }

    .recent-activity {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #666;
      font-size: 13px;
    }

    .activity-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4caf50;
    }

    .activity-indicator.pulse {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.2);
      }
    }

    .activity-text {
      font-style: italic;
    }
  `]
})
export class CollaborationPresenceComponent implements OnInit, OnDestroy {
  @Input() dossierId!: number;
  @Input() maxVisibleViewers = 5;

  viewers: ViewerInfo[] = [];
  viewerCount = 0;
  recentActivity: string | null = null;
  showActivityPulse = false;

  private subscriptions: Subscription[] = [];
  private activityTimeout: any;
  private viewerColors: Map<string, string> = new Map();

  constructor(private collaborationService: CollaborationService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.collaborationService.getViewers().subscribe(viewerIds => {
        this.viewerCount = viewerIds.size;
        this.updateViewerList(viewerIds);
      })
    );

    this.subscriptions.push(
      this.collaborationService.getPresenceUpdates().subscribe(presence => {
        this.handlePresenceUpdate(presence);
      })
    );
  }

  private updateViewerList(viewerIds: Set<string>): void {
    this.viewers = Array.from(viewerIds)
      .slice(0, this.maxVisibleViewers)
      .map(userId => {
        const username = this.getUsernameFromCache(userId);
        return {
          userId,
          username,
          color: this.getViewerColor(userId),
          initials: this.getInitials(username)
        };
      });
  }

  private handlePresenceUpdate(presence: CollaborationPresence): void {
    if (presence.action === 'joined') {
      this.recentActivity = `${presence.username} joined`;
      this.showActivityPulse = true;
    } else if (presence.action === 'left') {
      this.recentActivity = `${presence.username} left`;
      this.showActivityPulse = false;
    }

    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    this.activityTimeout = setTimeout(() => {
      this.recentActivity = null;
      this.showActivityPulse = false;
    }, 5000);
  }

  private getViewerColor(userId: string): string {
    if (!this.viewerColors.has(userId)) {
      this.collaborationService.getUserColor(userId).subscribe(result => {
        this.viewerColors.set(userId, result.color);
      });
    }
    return this.viewerColors.get(userId) || '#666';
  }

  private getUsernameFromCache(userId: string): string {
    return userId;
  }

  private getInitials(username: string): string {
    const parts = username.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  getExtraViewersTooltip(): string {
    return `${this.viewerCount - this.maxVisibleViewers} more viewers`;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
  }
}
