import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { HttpClient } from '@angular/common/http';

export interface CollaborationPresence {
  userId: string;
  username: string;
  dossierId: number;
  action: 'joined' | 'left';
  timestamp: Date;
}

export interface CollaborationCursor {
  userId: string;
  username: string;
  dossierId: number;
  fieldName: string;
  cursorPosition: number;
  color: string;
  timestamp: Date;
}

export interface CollaborationEdit {
  userId: string;
  username: string;
  dossierId: number;
  fieldName: string;
  newValue: any;
  oldValue: any;
  version: number;
  editId: string;
  timestamp: Date;
  metadata?: any;
}

export interface CollaborationActivity {
  userId: string;
  username: string;
  dossierId: number;
  activityType: string;
  description: string;
  data: any;
  timestamp: Date;
}

export interface SharedFilterPreset {
  id: number;
  name: string;
  description: string;
  filters: any;
  sharedBy: string;
  sharedByUsername: string;
  sharedAt: Date;
  sharedWithUserIds?: string[];
}

export interface ConflictResolution {
  fieldName: string;
  resolvedValue: any;
  resolvedBy: string;
  version: number;
}

@Injectable({
  providedIn: 'root'
})
export class CollaborationService implements OnDestroy {
  private currentDossierId: number | null = null;
  private currentUserId: string | null = null;
  private currentUsername: string | null = null;

  private viewers$ = new BehaviorSubject<Set<string>>(new Set());
  private presence$ = new Subject<CollaborationPresence>();
  private cursor$ = new Subject<CollaborationCursor>();
  private edit$ = new Subject<CollaborationEdit>();
  private activity$ = new Subject<CollaborationActivity>();
  private conflict$ = new Subject<ConflictResolution>();
  private filterPreset$ = new Subject<SharedFilterPreset>();

  private pendingEdits: Map<string, CollaborationEdit> = new Map();
  private fieldVersions: Map<string, number> = new Map();

  constructor(
    private webSocketService: WebSocketService,
    private http: HttpClient
  ) {}

  async initializeForDossier(dossierId: number, userId: string, username: string): Promise<void> {
    this.currentDossierId = dossierId;
    this.currentUserId = userId;
    this.currentUsername = username;

    await this.webSocketService.connect(userId, username);

    this.subscribeToChannels(dossierId);
    this.joinDossier(dossierId, userId, username);
  }

  private subscribeToChannels(dossierId: number): void {
    this.webSocketService.subscribe<CollaborationPresence>(`/topic/dossier/${dossierId}/presence`)
      .subscribe(presence => {
        this.presence$.next(presence);
      });

    this.webSocketService.subscribe<Set<string>>(`/topic/dossier/${dossierId}/viewers`)
      .subscribe(viewers => {
        this.viewers$.next(new Set(viewers));
      });

    this.webSocketService.subscribe<CollaborationCursor>(`/topic/dossier/${dossierId}/cursor`)
      .subscribe(cursor => {
        if (cursor.userId !== this.currentUserId) {
          this.cursor$.next(cursor);
        }
      });

    this.webSocketService.subscribe<CollaborationEdit>(`/topic/dossier/${dossierId}/edit`)
      .subscribe(edit => {
        if (edit.userId !== this.currentUserId) {
          this.handleRemoteEdit(edit);
        }
      });

    this.webSocketService.subscribe<CollaborationActivity>(`/topic/dossier/${dossierId}/activity`)
      .subscribe(activity => {
        this.activity$.next(activity);
      });

    this.webSocketService.subscribe<ConflictResolution>(`/topic/dossier/${dossierId}/conflict`)
      .subscribe(conflict => {
        this.conflict$.next(conflict);
      });

    this.webSocketService.subscribe<SharedFilterPreset>(`/topic/filter-presets`)
      .subscribe(filterPreset => {
        this.filterPreset$.next(filterPreset);
      });

    this.webSocketService.subscribe<SharedFilterPreset>(`/user/${this.currentUserId}/queue/filter-presets`)
      .subscribe(filterPreset => {
        this.filterPreset$.next(filterPreset);
      });
  }

  private joinDossier(dossierId: number, userId: string, username: string): void {
    this.webSocketService.send(`/app/dossier/${dossierId}/join`, {
      userId,
      username
    });
  }

  leaveDossier(): void {
    if (this.currentDossierId && this.currentUserId && this.currentUsername) {
      this.webSocketService.send(`/app/dossier/${this.currentDossierId}/leave`, {
        userId: this.currentUserId,
        username: this.currentUsername
      });
      this.currentDossierId = null;
    }
  }

  updateCursor(fieldName: string, cursorPosition: number): void {
    if (!this.currentDossierId || !this.currentUserId || !this.currentUsername) return;

    const cursor: CollaborationCursor = {
      userId: this.currentUserId,
      username: this.currentUsername,
      dossierId: this.currentDossierId,
      fieldName,
      cursorPosition,
      color: '',
      timestamp: new Date()
    };

    this.webSocketService.send(`/app/dossier/${this.currentDossierId}/cursor`, cursor);
  }

  broadcastEdit(fieldName: string, newValue: any, oldValue: any): CollaborationEdit {
    if (!this.currentDossierId || !this.currentUserId || !this.currentUsername) {
      throw new Error('Collaboration not initialized');
    }

    const version = (this.fieldVersions.get(fieldName) || 0) + 1;
    this.fieldVersions.set(fieldName, version);

    const edit: CollaborationEdit = {
      userId: this.currentUserId,
      username: this.currentUsername,
      dossierId: this.currentDossierId,
      fieldName,
      newValue,
      oldValue,
      version,
      editId: this.generateEditId(),
      timestamp: new Date()
    };

    this.pendingEdits.set(edit.editId, edit);
    this.webSocketService.send(`/app/dossier/${this.currentDossierId}/edit`, edit);

    return edit;
  }

  confirmEdit(editId: string): void {
    this.pendingEdits.delete(editId);
  }

  private handleRemoteEdit(edit: CollaborationEdit): void {
    const localVersion = this.fieldVersions.get(edit.fieldName) || 0;
    
    if (edit.version > localVersion) {
      this.fieldVersions.set(edit.fieldName, edit.version);
      this.edit$.next(edit);
    } else {
      console.warn('Conflict detected for field:', edit.fieldName);
    }
  }

  broadcastActivity(activityType: string, description: string, data: any): void {
    if (!this.currentDossierId || !this.currentUserId || !this.currentUsername) return;

    const activity: CollaborationActivity = {
      userId: this.currentUserId,
      username: this.currentUsername,
      dossierId: this.currentDossierId,
      activityType,
      description,
      data,
      timestamp: new Date()
    };

    this.webSocketService.send(`/app/dossier/${this.currentDossierId}/activity`, activity);
  }

  shareFilterPreset(filterPreset: SharedFilterPreset): void {
    this.webSocketService.send('/app/filter-preset/share', filterPreset);
  }

  resolveConflict(fieldName: string, resolvedValue: any): Observable<void> {
    if (!this.currentDossierId || !this.currentUserId) {
      throw new Error('Collaboration not initialized');
    }

    return this.http.post<void>(
      `/api/collaboration/dossier/${this.currentDossierId}/conflict/resolve`,
      {
        fieldName,
        resolvedValue,
        resolvedBy: this.currentUserId
      }
    );
  }

  getViewers(): Observable<Set<string>> {
    return this.viewers$.asObservable();
  }

  getPresenceUpdates(): Observable<CollaborationPresence> {
    return this.presence$.asObservable();
  }

  getCursorUpdates(): Observable<CollaborationCursor> {
    return this.cursor$.asObservable();
  }

  getEditUpdates(): Observable<CollaborationEdit> {
    return this.edit$.asObservable();
  }

  getActivityUpdates(): Observable<CollaborationActivity> {
    return this.activity$.asObservable();
  }

  getConflictUpdates(): Observable<ConflictResolution> {
    return this.conflict$.asObservable();
  }

  getFilterPresetUpdates(): Observable<SharedFilterPreset> {
    return this.filterPreset$.asObservable();
  }

  getCurrentViewers(dossierId: number): Observable<Set<string>> {
    return this.http.get<Set<string>>(`/api/collaboration/dossier/${dossierId}/viewers`);
  }

  getCurrentVersion(dossierId: number): Observable<{ dossierId: number; version: number }> {
    return this.http.get<{ dossierId: number; version: number }>(
      `/api/collaboration/dossier/${dossierId}/version`
    );
  }

  getUserColor(userId: string): Observable<{ userId: string; color: string }> {
    return this.http.get<{ userId: string; color: string }>(
      `/api/collaboration/user/${userId}/color`
    );
  }

  private generateEditId(): string {
    return `${this.currentUserId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnDestroy(): void {
    this.leaveDossier();
    this.webSocketService.disconnect();
  }
}
