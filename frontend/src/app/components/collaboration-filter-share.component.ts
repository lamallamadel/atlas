import { Component, OnInit, OnDestroy } from '@angular/core';
import { CollaborationService, SharedFilterPreset } from '../services/collaboration.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-collaboration-filter-share',
  template: `
    <div class="filter-share-container">
      <h3 class="section-header">
        <span class="header-icon">🔍</span>
        Shared Filter Presets
      </h3>
      
      <div class="filter-list">
        <div *ngFor="let filter of sharedFilters" 
             class="filter-item"
             (click)="applyFilter(filter)">
          <div class="filter-icon">
            <span>📊</span>
          </div>
          <div class="filter-content">
            <div class="filter-name">{{ filter.name }}</div>
            <div class="filter-meta">
              <span class="shared-by">Shared by {{ filter.sharedByUsername }}</span>
              <span class="shared-time">{{ formatTimestamp(filter.sharedAt) }}</span>
            </div>
            <div *ngIf="filter.description" class="filter-description">
              {{ filter.description }}
            </div>
          </div>
          <button class="apply-btn" (click)="applyFilter(filter); $event.stopPropagation()">
            Apply
          </button>
        </div>
        
        <div *ngIf="sharedFilters.length === 0" class="no-filters">
          <span class="empty-icon">🔍</span>
          <p>No shared filter presets</p>
        </div>
      </div>
      
      <div class="share-section">
        <h4>Share Current Filters</h4>
        <div class="share-form">
          <input type="text" 
                 [(ngModel)]="newFilterName" 
                 placeholder="Filter preset name"
                 class="filter-input">
          <textarea [(ngModel)]="newFilterDescription" 
                    placeholder="Description (optional)"
                    class="filter-textarea"
                    rows="2"></textarea>
          <button class="share-btn" 
                  (click)="shareCurrentFilters()"
                  [disabled]="!newFilterName">
            <span class="btn-icon">📤</span>
            Share with Team
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-share-container {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .section-header {
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

    .filter-list {
      margin-bottom: 24px;
    }

    .filter-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      align-items: center;
    }

    .filter-item:hover {
      border-color: #2196f3;
      box-shadow: 0 2px 6px rgba(33, 150, 243, 0.2);
    }

    .filter-icon {
      width: 40px;
      height: 40px;
      background: #e3f2fd;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 20px;
    }

    .filter-content {
      flex: 1;
      min-width: 0;
    }

    .filter-name {
      font-weight: 600;
      font-size: 14px;
      color: #333;
      margin-bottom: 4px;
    }

    .filter-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .filter-description {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .apply-btn {
      padding: 6px 16px;
      background: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .apply-btn:hover {
      background: #1976d2;
    }

    .no-filters {
      text-align: center;
      padding: 32px;
      color: #999;
    }

    .empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 8px;
    }

    .share-section {
      border-top: 1px solid #e0e0e0;
      padding-top: 16px;
    }

    .share-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .share-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-input,
    .filter-textarea {
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
    }

    .filter-input:focus,
    .filter-textarea:focus {
      outline: none;
      border-color: #2196f3;
    }

    .share-btn {
      padding: 10px 16px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .share-btn:hover:not(:disabled) {
      background: #45a049;
    }

    .share-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .btn-icon {
      font-size: 16px;
    }
  `]
})
export class CollaborationFilterShareComponent implements OnInit, OnDestroy {
  sharedFilters: SharedFilterPreset[] = [];
  newFilterName = '';
  newFilterDescription = '';

  private subscriptions: Subscription[] = [];
  private currentFilters: any = {};

  constructor(
    private collaborationService: CollaborationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.collaborationService.getFilterPresetUpdates().subscribe(filter => {
        this.addSharedFilter(filter);
      })
    );
  }

  private addSharedFilter(filter: SharedFilterPreset): void {
    const existingIndex = this.sharedFilters.findIndex(f => f.id === filter.id);
    
    if (existingIndex >= 0) {
      this.sharedFilters[existingIndex] = filter;
    } else {
      this.sharedFilters.unshift(filter);
    }

    this.snackBar.open(`New filter preset shared: ${filter.name}`, 'View', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  applyFilter(filter: SharedFilterPreset): void {
    console.log('Applying filter:', filter);
    this.snackBar.open(`Applied filter: ${filter.name}`, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  setCurrentFilters(filters: any): void {
    this.currentFilters = filters;
  }

  shareCurrentFilters(): void {
    if (!this.newFilterName.trim()) {
      this.snackBar.open('Please enter a filter name', 'Close', {
        duration: 3000
      });
      return;
    }

    const filterPreset: SharedFilterPreset = {
      id: Date.now(),
      name: this.newFilterName,
      description: this.newFilterDescription,
      filters: this.currentFilters,
      sharedBy: 'current-user',
      sharedByUsername: 'Current User',
      sharedAt: new Date()
    };

    this.collaborationService.shareFilterPreset(filterPreset);

    this.snackBar.open(`Filter preset "${this.newFilterName}" shared with team`, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    this.newFilterName = '';
    this.newFilterDescription = '';
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
