import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, interval, of, timer } from 'rxjs';
import { tap, catchError, switchMap, takeUntil, filter, retry, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { OfflineService } from './offline.service';
import {
  UserPreferences,
  CategoryPreferencesResponse,
  PendingUpdate
} from '../models/user-preferences.model';

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService implements OnDestroy {
  private readonly API_BASE = `${environment.apiBaseUrl}/v1/user/preferences`;
  private readonly STORAGE_KEY = 'user_preferences';
  private readonly PENDING_UPDATES_KEY = 'user_preferences_pending';
  private readonly LAST_SYNC_KEY = 'user_preferences_last_sync';
  private readonly POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  private preferencesSubject = new BehaviorSubject<UserPreferences>({});
  public preferences$: Observable<UserPreferences> = this.preferencesSubject.asObservable();

  private destroy$ = new Subject<void>();
  private syncInProgress = false;
  private initialLoadComplete = false;

  constructor(
    private http: HttpClient,
    private offlineService: OfflineService
  ) {
    this.initializeService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeService(): void {
    this.loadFromLocalStorage();
    this.loadFromServer();
    this.startPolling();
    this.monitorOnlineStatus();
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        this.preferencesSubject.next(preferences);
      }
    } catch (error) {
      console.error('Error loading preferences from localStorage:', error);
    }
  }

  private saveToLocalStorage(preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
      localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  }

  private loadFromServer(): void {
    this.http.get<Record<string, unknown>>(this.API_BASE)
      .pipe(
        retry(2),
        catchError(error => {
          console.error('Error loading preferences from server:', error);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(serverPreferences => {
        if (serverPreferences) {
          const preferences = this.normalizePreferences(serverPreferences);
          this.preferencesSubject.next(preferences);
          this.saveToLocalStorage(preferences);
          this.initialLoadComplete = true;
        }
      });
  }

  private normalizePreferences(data: Record<string, unknown>): UserPreferences {
    return data as UserPreferences;
  }

  private startPolling(): void {
    interval(this.POLLING_INTERVAL)
      .pipe(
        filter(() => this.offlineService.isOnline()),
        filter(() => !this.syncInProgress),
        switchMap(() => this.checkForUpdates()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private checkForUpdates(): Observable<any> {
    const lastSync = parseInt(localStorage.getItem(this.LAST_SYNC_KEY) || '0', 10);
    
    return this.http.get<Record<string, unknown>>(this.API_BASE)
      .pipe(
        retry(1),
        tap(serverPreferences => {
          if (serverPreferences) {
            const currentPreferences = this.preferencesSubject.value;
            const newPreferences = this.normalizePreferences(serverPreferences);
            
            if (JSON.stringify(currentPreferences) !== JSON.stringify(newPreferences)) {
              console.log('Preferences updated from server (cross-tab/cross-device sync)');
              this.preferencesSubject.next(newPreferences);
              this.saveToLocalStorage(newPreferences);
            } else {
              localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
            }
          }
        }),
        catchError(error => {
          console.error('Error checking for preference updates:', error);
          return of(null);
        })
      );
  }

  private monitorOnlineStatus(): void {
    this.offlineService.connectivity$
      .pipe(
        filter(state => state.status !== 'OFFLINE'),
        switchMap(() => timer(1000)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.processPendingUpdates();
      });
  }

  private getPendingUpdates(): PendingUpdate[] {
    try {
      const stored = localStorage.getItem(this.PENDING_UPDATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading pending updates:', error);
      return [];
    }
  }

  private savePendingUpdates(updates: PendingUpdate[]): void {
    try {
      localStorage.setItem(this.PENDING_UPDATES_KEY, JSON.stringify(updates));
    } catch (error) {
      console.error('Error saving pending updates:', error);
    }
  }

  private addPendingUpdate(category: string, values: Record<string, unknown>): void {
    const pending = this.getPendingUpdates();
    const existingIndex = pending.findIndex(u => u.category === category);
    
    const update: PendingUpdate = {
      category,
      values,
      timestamp: Date.now(),
      retries: 0
    };

    if (existingIndex >= 0) {
      pending[existingIndex] = update;
    } else {
      pending.push(update);
    }

    this.savePendingUpdates(pending);
  }

  private processPendingUpdates(): void {
    if (this.syncInProgress || !this.offlineService.isOnline()) {
      return;
    }

    const pending = this.getPendingUpdates();
    if (pending.length === 0) {
      return;
    }

    this.syncInProgress = true;

    const processNext = (index: number): void => {
      if (index >= pending.length) {
        this.syncInProgress = false;
        this.savePendingUpdates([]);
        this.loadFromServer();
        return;
      }

      const update = pending[index];
      
      this.http.put<CategoryPreferencesResponse>(
        `${this.API_BASE}/${update.category}`,
        { preferences: update.values }
      )
      .pipe(
        retry(1),
        catchError(error => {
          console.error(`Error syncing pending update for ${update.category}:`, error);
          
          if (update.retries < this.MAX_RETRIES) {
            update.retries++;
            return of(null);
          } else {
            console.error(`Max retries reached for ${update.category}, discarding update`);
            return of(null);
          }
        })
      )
      .subscribe(response => {
        if (response) {
          console.log(`Successfully synced pending update for ${update.category}`);
        }
        processNext(index + 1);
      });
    };

    processNext(0);
  }

  public getPreferences(): Observable<UserPreferences> {
    return this.preferences$;
  }

  public getCurrentPreferences(): UserPreferences {
    return this.preferencesSubject.value;
  }

  public getPreferencesByCategory(category: string): Observable<Record<string, unknown>> {
    const current = this.preferencesSubject.value;
    return of((current as any)[category] || {});
  }

  public getCurrentPreferencesByCategory(category: string): Record<string, unknown> {
    const current = this.preferencesSubject.value;
    return (current as any)[category] || {};
  }

  public updatePreferences(category: string, values: Record<string, unknown>): Observable<CategoryPreferencesResponse> {
    const currentPreferences = { ...this.preferencesSubject.value };
    (currentPreferences as any)[category] = {
      ...(currentPreferences as any)[category],
      ...values
    };
    
    this.preferencesSubject.next(currentPreferences);
    this.saveToLocalStorage(currentPreferences);

    if (!this.offlineService.isOnline()) {
      this.addPendingUpdate(category, values);
      return of({
        category,
        preferences: values
      });
    }

    return this.http.put<CategoryPreferencesResponse>(
      `${this.API_BASE}/${category}`,
      { preferences: values }
    ).pipe(
      tap(response => {
        const updated = { ...this.preferencesSubject.value };
        (updated as any)[category] = response.preferences;
        this.preferencesSubject.next(updated);
        this.saveToLocalStorage(updated);
      }),
      catchError(error => {
        console.error(`Error updating preferences for ${category}:`, error);
        this.addPendingUpdate(category, values);
        return of({
          category,
          preferences: values
        });
      })
    );
  }

  public resetToDefaults(category?: string): Observable<UserPreferences> {
    if (!category) {
      return this.resetAllPreferences();
    }

    return this.http.post<Record<string, unknown>>(`${this.API_BASE}/reset`, {})
      .pipe(
        tap(serverPreferences => {
          const preferences = this.normalizePreferences(serverPreferences);
          this.preferencesSubject.next(preferences);
          this.saveToLocalStorage(preferences);
        }),
        catchError(error => {
          console.error('Error resetting preferences:', error);
          
          const defaults: UserPreferences = {};
          this.preferencesSubject.next(defaults);
          this.saveToLocalStorage(defaults);
          return of(defaults);
        }),
        shareReplay(1)
      );
  }

  private resetAllPreferences(): Observable<UserPreferences> {
    return this.http.post<Record<string, unknown>>(`${this.API_BASE}/reset`, {})
      .pipe(
        tap(serverPreferences => {
          const preferences = this.normalizePreferences(serverPreferences);
          this.preferencesSubject.next(preferences);
          this.saveToLocalStorage(preferences);
          
          const pending = this.getPendingUpdates();
          if (pending.length > 0) {
            this.savePendingUpdates([]);
          }
        }),
        catchError(error => {
          console.error('Error resetting all preferences:', error);
          
          const defaults: UserPreferences = {};
          this.preferencesSubject.next(defaults);
          this.saveToLocalStorage(defaults);
          return of(defaults);
        }),
        shareReplay(1)
      );
  }

  public setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    const prefs = this.preferencesSubject.value;
    const updated = { ...prefs, [key]: value };
    this.preferencesSubject.next(updated);
    this.saveToLocalStorage(updated);
  }

  public getPreference<K extends keyof UserPreferences>(key: K, defaultValue?: UserPreferences[K]): UserPreferences[K] {
    const prefs = this.preferencesSubject.value;
    return prefs[key] !== undefined ? prefs[key] : defaultValue;
  }

  public clearPreferences(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.PENDING_UPDATES_KEY);
    localStorage.removeItem(this.LAST_SYNC_KEY);
    this.preferencesSubject.next({});
  }

  public hasPendingUpdates(): boolean {
    return this.getPendingUpdates().length > 0;
  }

  public getPendingUpdatesCount(): number {
    return this.getPendingUpdates().length;
  }

  public forceSyncNow(): Observable<any> {
    return this.checkForUpdates().pipe(
      switchMap(() => {
        this.processPendingUpdates();
        return of(true);
      })
    );
  }
}
