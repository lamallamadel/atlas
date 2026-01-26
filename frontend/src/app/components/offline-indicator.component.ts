import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OfflineService, ConnectionStatus, ConnectivityState } from '../services/offline.service';
import { OfflineQueueService, SyncProgress } from '../services/offline-queue.service';
import { trigger, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-offline-indicator',
  template: `
    <div class="offline-indicator" 
         *ngIf="shouldShowIndicator" 
         [@slideDown]
         [class.offline]="isOffline"
         [class.slow]="isSlow"
         [class.syncing]="isSyncing">
      <div class="indicator-content">
        <mat-icon class="indicator-icon">
          {{ getIcon() }}
        </mat-icon>
        <span class="indicator-text">{{ getMessage() }}</span>
        
        <div class="sync-progress" *ngIf="isSyncing && syncProgress">
          <mat-progress-bar 
            mode="determinate" 
            [value]="getSyncPercentage()">
          </mat-progress-bar>
          <span class="progress-text">
            {{ syncProgress.completed }}/{{ syncProgress.total }}
          </span>
        </div>
        
        <button mat-button 
                *ngIf="pendingCount > 0 && !isSyncing && !isOffline"
                (click)="triggerSync()"
                class="sync-button">
          <mat-icon>sync</mat-icon>
          Synchroniser ({{ pendingCount }})
        </button>
        
        <button mat-icon-button 
                (click)="dismiss()"
                class="dismiss-button"
                aria-label="Fermer">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .offline-indicator {
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      background-color: #1976d2;
      color: white;
      padding: 12px 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .offline-indicator.offline {
      background-color: #f44336;
    }

    .offline-indicator.slow {
      background-color: #ff9800;
    }

    .offline-indicator.syncing {
      background-color: #4caf50;
    }

    .indicator-content {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 1200px;
      width: 100%;
    }

    .indicator-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .indicator-text {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .sync-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 200px;
    }

    .sync-progress mat-progress-bar {
      flex: 1;
    }

    .progress-text {
      font-size: 12px;
      white-space: nowrap;
    }

    .sync-button {
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    .dismiss-button {
      color: white;
    }

    @media (max-width: 768px) {
      .offline-indicator {
        top: 56px;
        padding: 8px 12px;
      }

      .indicator-content {
        flex-wrap: wrap;
      }

      .indicator-text {
        font-size: 12px;
      }

      .sync-progress {
        min-width: 150px;
      }
    }
  `],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-100%)' }))
      ])
    ])
  ]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  connectivityState: ConnectivityState | null = null;
  syncProgress: SyncProgress | null = null;
  pendingCount = 0;
  isDismissed = false;

  constructor(
    private offlineService: OfflineService,
    private queueService: OfflineQueueService
  ) {}

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
    if (this.isDismissed) {
      return false;
    }
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
    if (this.isSyncing) {
      return 'sync';
    }
    if (this.isOffline) {
      return 'cloud_off';
    }
    if (this.isSlow) {
      return 'signal_cellular_alt_2_bar';
    }
    return 'cloud_queue';
  }

  getMessage(): string {
    if (this.isSyncing) {
      return 'Synchronisation en cours...';
    }
    if (this.isOffline) {
      const lastOnline = this.connectivityState?.lastOnline;
      if (lastOnline) {
        const minutes = Math.floor((Date.now() - lastOnline.getTime()) / 60000);
        if (minutes < 1) {
          return 'Mode hors ligne';
        }
        return `Mode hors ligne depuis ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      return 'Mode hors ligne';
    }
    if (this.isSlow) {
      return 'Connexion lente détectée';
    }
    if (this.pendingCount > 0) {
      return `${this.pendingCount} action${this.pendingCount > 1 ? 's' : ''} en attente de synchronisation`;
    }
    return 'Connexion rétablie';
  }

  getSyncPercentage(): number {
    if (!this.syncProgress || this.syncProgress.total === 0) {
      return 0;
    }
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
