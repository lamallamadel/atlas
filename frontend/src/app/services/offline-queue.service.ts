import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { filter } from 'rxjs/operators';
import { OfflineService } from './offline.service';
import { OfflineStorageService } from './offline-storage.service';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from './notification.service';

export enum QueuedActionType {
  CREATE_MESSAGE = 'CREATE_MESSAGE',
  UPDATE_DOSSIER_STATUS = 'UPDATE_DOSSIER_STATUS',
  CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
  UPDATE_APPOINTMENT = 'UPDATE_APPOINTMENT',
  CREATE_NOTE = 'CREATE_NOTE'
}

export enum QueuedActionStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT'
}

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: any;
  timestamp: number;
  status: QueuedActionStatus;
  retryCount: number;
  error?: string;
  localId?: string;
  serverId?: number;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private syncProgressSubject = new BehaviorSubject<SyncProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false
  });

  public syncProgress$: Observable<SyncProgress> = this.syncProgressSubject.asObservable();

  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRY_COUNT = 3;
  private isSyncing = false;

  constructor(
    private offlineService: OfflineService,
    private storageService: OfflineStorageService,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    this.initializeBackgroundSync();
  }

  private initializeBackgroundSync(): void {
    this.offlineService.connectivity$
      .pipe(
        filter(state => state.status !== 'OFFLINE')
      )
      .subscribe(() => {
        this.syncQueue();
      });

    interval(this.SYNC_INTERVAL)
      .pipe(
        filter(() => this.offlineService.isOnline() && !this.isSyncing)
      )
      .subscribe(() => {
        this.syncQueue();
      });

    if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
      navigator.serviceWorker.ready.then(registration => {
        return (registration as any).sync.register('offline-queue-sync');
      }).catch(err => {
        console.warn('Background sync not supported:', err);
      });
    }
  }

  async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const queuedAction: QueuedAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      status: QueuedActionStatus.PENDING,
      retryCount: 0
    };

    await this.storageService.addQueuedAction(queuedAction);
    
    this.notificationService.info('Action mise en file d\'attente', 'Voir');

    if (this.offlineService.isOnline()) {
      setTimeout(() => this.syncQueue(), 100);
    }

    return queuedAction.id;
  }

  async syncQueue(): Promise<void> {
    if (this.isSyncing || !this.offlineService.isOnline()) {
      return;
    }

    this.isSyncing = true;
    const pendingActions = await this.storageService.getPendingActions();

    if (pendingActions.length === 0) {
      this.isSyncing = false;
      return;
    }

    this.syncProgressSubject.next({
      total: pendingActions.length,
      completed: 0,
      failed: 0,
      inProgress: true
    });

    let completed = 0;
    let failed = 0;

    for (const action of pendingActions) {
      try {
        await this.syncAction(action);
        completed++;
        this.notificationService.success(`Action synchronisée: ${this.getActionLabel(action.type)}`);
      } catch (error: any) {
        failed++;
        action.retryCount++;
        action.error = error.message || 'Unknown error';

        if (action.retryCount >= this.MAX_RETRY_COUNT) {
          action.status = QueuedActionStatus.FAILED;
          this.notificationService.error(
            `Échec de synchronisation: ${this.getActionLabel(action.type)}`,
            'Réessayer',
            () => this.retryAction(action.id)
          );
        } else {
          action.status = QueuedActionStatus.PENDING;
        }

        await this.storageService.updateQueuedAction(action);
      }

      this.syncProgressSubject.next({
        total: pendingActions.length,
        completed,
        failed,
        inProgress: true
      });
    }

    this.syncProgressSubject.next({
      total: pendingActions.length,
      completed,
      failed,
      inProgress: false
    });

    this.isSyncing = false;

    if (completed > 0) {
      this.notificationService.success(`${completed} action(s) synchronisée(s) avec succès`);
    }
  }

  private async syncAction(action: QueuedAction): Promise<void> {
    action.status = QueuedActionStatus.SYNCING;
    await this.storageService.updateQueuedAction(action);

    let response: any;

    switch (action.type) {
      case QueuedActionType.CREATE_MESSAGE:
        response = await this.http.post('/api/v1/messages', action.payload).toPromise();
        break;

      case QueuedActionType.UPDATE_DOSSIER_STATUS:
        response = await this.http.patch(
          `/api/v1/dossiers/${action.payload.id}/status`,
          { status: action.payload.status }
        ).toPromise();
        break;

      case QueuedActionType.CREATE_APPOINTMENT:
        response = await this.http.post('/api/v1/appointments', action.payload).toPromise();
        break;

      case QueuedActionType.UPDATE_APPOINTMENT:
        response = await this.http.put(
          `/api/v1/appointments/${action.payload.id}`,
          action.payload
        ).toPromise();
        break;

      case QueuedActionType.CREATE_NOTE:
        response = await this.http.post('/api/v1/notes', action.payload).toPromise();
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    action.status = QueuedActionStatus.SUCCESS;
    action.serverId = response?.id;
    await this.storageService.updateQueuedAction(action);

    if (action.localId && response?.id) {
      await this.storageService.mapLocalToServerId(action.localId, response.id);
    }
  }

  async retryAction(actionId: string): Promise<void> {
    const action = await this.storageService.getQueuedAction(actionId);
    if (action) {
      action.status = QueuedActionStatus.PENDING;
      action.retryCount = 0;
      action.error = undefined;
      await this.storageService.updateQueuedAction(action);
      
      if (this.offlineService.isOnline()) {
        await this.syncQueue();
      }
    }
  }

  async clearQueue(): Promise<void> {
    await this.storageService.clearQueue();
    this.syncProgressSubject.next({
      total: 0,
      completed: 0,
      failed: 0,
      inProgress: false
    });
  }

  async getPendingActionsCount(): Promise<number> {
    const actions = await this.storageService.getPendingActions();
    return actions.length;
  }

  async getFailedActions(): Promise<QueuedAction[]> {
    return this.storageService.getFailedActions();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getActionLabel(type: QueuedActionType): string {
    const labels: Record<QueuedActionType, string> = {
      [QueuedActionType.CREATE_MESSAGE]: 'Création de message',
      [QueuedActionType.UPDATE_DOSSIER_STATUS]: 'Changement de statut',
      [QueuedActionType.CREATE_APPOINTMENT]: 'Création de rendez-vous',
      [QueuedActionType.UPDATE_APPOINTMENT]: 'Mise à jour de rendez-vous',
      [QueuedActionType.CREATE_NOTE]: 'Création de note'
    };
    return labels[type] || type;
  }
}
