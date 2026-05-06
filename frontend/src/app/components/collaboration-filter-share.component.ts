import { Component, OnInit, OnDestroy } from '@angular/core';
import { CollaborationService, SharedFilterPreset } from '../services/collaboration.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-collaboration-filter-share',
    template: `
    <div class="filter-share-container">
      <h3 class="section-header">
        <span class="header-icon">🔍</span>
        Shared Filter Presets
      </h3>
    
      <div class="filter-list">
        @for (filter of sharedFilters; track filter) {
          <div
            class="filter-item"
            role="button"
            tabindex="0"
            (click)="applyFilter(filter)"
            (keydown.enter)="applyFilter(filter)"
            (keydown.space)="$event.preventDefault(); applyFilter(filter)">
            <div class="filter-icon">
              <span>📊</span>
            </div>
            <div class="filter-content">
              <div class="filter-name">{{ filter.name }}</div>
              <div class="filter-meta">
                <span class="shared-by">Shared by {{ filter.sharedByUsername }}</span>
                <span class="shared-time">{{ formatTimestamp(filter.sharedAt) }}</span>
              </div>
              @if (filter.description) {
                <div class="filter-description">
                  {{ filter.description }}
                </div>
              }
            </div>
            <button class="apply-btn" (click)="applyFilter(filter); $event.stopPropagation()">
              Apply
            </button>
          </div>
        }
    
        @if (sharedFilters.length === 0) {
          <div class="no-filters">
            <span class="empty-icon">🔍</span>
            <p>No shared filter presets</p>
          </div>
        }
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
      background: var(--ds-surface);
      border-radius: var(--ds-radius-md);
      padding: var(--ds-space-4);
      box-shadow: var(--ds-shadow-sm);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      margin: 0 0 var(--ds-space-4) 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--ds-text);
    }

    .header-icon {
      font-size: 20px;
    }

    .filter-list {
      margin-bottom: var(--ds-space-6);
    }

    .filter-item {
      display: flex;
      gap: var(--ds-space-3);
      padding: var(--ds-space-3);
      border: 1px solid var(--ds-divider);
      border-radius: var(--ds-radius-sm);
      margin-bottom: var(--ds-space-2);
      cursor: pointer;
      transition: border-color var(--ds-transition-fast), box-shadow var(--ds-transition-fast);
      align-items: center;
    }

    .filter-item:hover {
      border-color: var(--ds-marine);
      box-shadow: var(--ds-shadow-sm);
    }

    .filter-icon {
      width: 40px;
      height: 40px;
      background: var(--ds-marine-hl);
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
      color: var(--ds-text);
      margin-bottom: var(--ds-space-1);
    }

    .filter-meta {
      display: flex;
      gap: var(--ds-space-3);
      font-size: 12px;
      color: var(--ds-text-muted);
      margin-bottom: var(--ds-space-1);
    }

    .filter-description {
      font-size: 12px;
      color: var(--ds-text-muted);
      margin-top: var(--ds-space-1);
    }

    .apply-btn {
      padding: 6px var(--ds-space-4);
      background: var(--ds-marine);
      color: var(--ds-text-inverse);
      border: none;
      border-radius: var(--ds-radius-sm);
      font-weight: 500;
      cursor: pointer;
      transition: background var(--ds-transition-fast);
    }

    .apply-btn:hover {
      background: var(--ds-marine-light);
    }

    .no-filters {
      text-align: center;
      padding: var(--ds-space-8);
      color: var(--ds-text-faint);
    }

    .empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: var(--ds-space-2);
    }

    .share-section {
      border-top: 1px solid var(--ds-divider);
      padding-top: var(--ds-space-4);
    }

    .share-section h4 {
      margin: 0 0 var(--ds-space-3) 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--ds-text);
    }

    .share-form {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
    }

    .filter-input,
    .filter-textarea {
      padding: var(--ds-space-2) var(--ds-space-3);
      border: 1px solid var(--ds-divider);
      border-radius: var(--ds-radius-sm);
      font-size: 14px;
      font-family: inherit;
      background: var(--ds-surface);
      color: var(--ds-text);
    }

    .filter-input:focus,
    .filter-textarea:focus {
      outline: none;
      border-color: var(--ds-marine);
    }

    .share-btn {
      padding: 10px var(--ds-space-4);
      background: var(--ds-success);
      color: var(--ds-text-inverse);
      border: none;
      border-radius: var(--ds-radius-sm);
      font-weight: 500;
      cursor: pointer;
      transition: filter var(--ds-transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .share-btn:hover:not(:disabled) {
      filter: brightness(0.92);
    }

    .share-btn:disabled {
      background: var(--ds-surface-dynamic);
      color: var(--ds-text-faint);
      cursor: not-allowed;
      filter: none;
    }

    .btn-icon {
      font-size: 16px;
    }
  `],
    imports: [FormsModule]
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
