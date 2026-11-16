import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OfflineService, ConnectionStatus, ConnectivityState } from '../services/offline.service';
import { OfflineQueueService, SyncProgress } from '../services/offline-queue.service';
import { trigger, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsProgressBarComponent 
} from '../design-system';

@Component({
    selector: 'app-offline-indicator',
    standalone: true,
    template: `
    @if (shouldShowIndicator) {
      <div class="offline-indicator"
        [@slideDown]
        [class.offline]="isOffline"
        [class.slow]="isSlow"
        [class.syncing]="isSyncing">
        <div class="indicator-content">
          <ds-icon class="indicator-icon" [name]="getIcon()" [size]="20"></ds-icon>
          <span class="indicator-text">{{ getMessage() }}</span>
          
          @if (isSyncing && syncProgress) {
            <div class="sync-progress">
              <ds-progress-bar
                mode="determinate"
                [value]="getSyncPercentage()"
                variant="neutral">
              </ds-progress-bar>
              <span class="progress-text">
                {{ syncProgress.completed }}/{{ syncProgress.total }}
              </span>
            </div>
          }
          
          @if (pendingCount > 0 && !isSyncing && !isOffline) {
            <ds-button variant="ghost" size="sm" (dsClick)="triggerSync()" class="sync-button">
              <ds-icon name="refresh" [size]="16" style="margin-right: 8px;"></ds-icon>
              Synchroniser ({{ pendingCount }})
            </ds-button>
          }
          
          <ds-button variant="icon" size="sm" (dsClick)="dismiss()" class="dismiss-button" ariaLabel="Fermer">
            <ds-icon name="close" [size]="16"></ds-icon>
          </ds-button>
        </div>
      </div>
    }
    `,
    styles: [`
    .offline-indicator {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background-color: var(--ds-marine);
      color: white;
      padding: 12px 24px;
      box-shadow: var(--ds-shadow-md);
      z-index: 10002; /* Above navigation loader */
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.3s ease;
    }

    .offline-indicator.offline {
      background-color: var(--ds-error);
    }

    .offline-indicator.slow {
      background-color: var(--ds-warning);
    }

    .offline-indicator.syncing {
      background-color: var(--ds-success);
    }

    .indicator-content {
      display: flex;
      align-items: center;
      gap: 16px;
      max-width: 1200px;
      width: 100%;
    }

    .indicator-text {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
    }

    .sync-progress {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 180px;
    }

    .sync-progress ds-progress-bar {
      flex: 1;
    }

    .progress-text {
      font-size: 11px;
      font-family: var(--ds-font-mono);
      white-space: nowrap;
    }

    .sync-button {
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .dismiss-button {
      color: white;
      opacity: 0.8;
      &:hover { opacity: 1; }
    }

    @media (max-width: 768px) {
      .indicator-content {
        gap: 12px;
      }
      .indicator-text {
        font-size: 12px;
      }
      .sync-progress {
        min-width: 120px;
      }
    }
  `],
    animations: [
        trigger('slideDown', [
            transition(':enter', [
                style({ transform: 'translateY(-100%)' }),
                animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateY(-100%)' }))
            ])
        ])
    ],
    imports: [
      CommonModule, 
      DsIconComponent, 
      DsProgressBarComponent, 
      DsButtonComponent
    ]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  private offlineService = inject(OfflineService);
  private queueService = inject(OfflineQueueService);
  
  private destroy$ = new Subject<void>();

  connectivityState: ConnectivityState | null = null;
  syncProgress: SyncProgress | null = null;
  pendingCount = 0;
  isDismissed = false;

  ngOnInit(): void {
    this.offlineService.connectivity$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.connectivityState = state;
        this.isDismissed = false;
        this.updatePendingCount();
      });

    this.queueService.syncProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.syncProgress = progress;
        if (!progress.inProgress && progress.completed > 0) {
          this.updatePendingCount();
        }
      });

    this.updatePendingCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get shouldShowIndicator(): boolean {
    if (this.isDismissed) return false;
    return this.isOffline || this.isSlow || this.isSyncing || this.pendingCount > 0;
  }

  get isOffline(): boolean {
    return this.connectivityState?.status === ConnectionStatus.OFFLINE;
  }

  get isSlow(): boolean {
    return this.connectivityState?.status === ConnectionStatus.SLOW;
  }

  get isSyncing(): boolean {
    return this.syncProgress?.inProgress || false;
  }

  getIcon(): string {
    if (this.isSyncing) return 'refresh';
    if (this.isOffline) return 'info';
    if (this.isSlow)    return 'info';
    return 'check';
  }

  getMessage(): string {
    if (this.isSyncing) return 'Synchronisation en cours...';
    if (this.isOffline) {
      const lastOnline = this.connectivityState?.lastOnline;
      if (lastOnline) {
        const minutes = Math.floor((Date.now() - lastOnline.getTime()) / 60000);
        if (minutes < 1) return 'Mode hors ligne';
        return `Mode hors ligne depuis ${minutes} min`;
      }
      return 'Mode hors ligne';
    }
    if (this.isSlow) return 'Connexion lente détectée';
    if (this.pendingCount > 0) return `${this.pendingCount} action(s) en attente`;
    return 'Connexion rétablie';
  }

  getSyncPercentage(): number {
    if (!this.syncProgress || this.syncProgress.total === 0) return 0;
    return (this.syncProgress.completed / this.syncProgress.total) * 100;
  }

  async triggerSync(): Promise<void> {
    await this.queueService.syncQueue();
  }

  dismiss(): void {
    this.isDismissed = true;
  }

  private async updatePendingCount(): Promise<void> {
    this.pendingCount = await this.queueService.getPendingActionsCount();
  }
}
