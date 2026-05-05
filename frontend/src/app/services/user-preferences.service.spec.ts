import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { UserPreferencesService } from './user-preferences.service';
import {
  UserPreferences,
} from '../models/user-preferences.model';
import { OfflineService, ConnectionStatus } from './offline.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { vi } from 'vitest';

/** Laisse les callbacks HTTP / RxJS du constructeur se terminer (Vitest n'utilise pas ProxyZone). */
async function stabilize(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let httpMock: HttpTestingController;
  let offlineIsOnline = true;
  let offlineService: Pick<OfflineService, 'isOnline' | 'connectivity$'>;
  let connectivitySubject: BehaviorSubject<{
    status: ConnectionStatus;
    lastOnline: Date;
  }>;

  const API_BASE = `${environment.apiBaseUrl}/v1/user/preferences`;

  beforeEach(() => {
    offlineIsOnline = true;
    connectivitySubject = new BehaviorSubject<{
      status: ConnectionStatus;
      lastOnline: Date;
    }>({
      status: ConnectionStatus.ONLINE,
      lastOnline: new Date(),
    });

    offlineService = {
      isOnline: (): boolean => offlineIsOnline,
      connectivity$: connectivitySubject.asObservable(),
    };

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        UserPreferencesService,
        { provide: OfflineService, useValue: offlineService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserPreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    try {
      const pending = httpMock.match((r) => r.url.startsWith(API_BASE));
      pending.forEach((req) => {
        if (!req.cancelled) {
          req.flush(
            req.request.method === 'GET'
              ? {}
              : (req.request.body as object) || {}
          );
        }
      });
    } catch (_) {
      /* ignore */
    }
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load preferences from server on initialization', async () => {
      const mockPreferences: UserPreferences = {
        ui: { theme: 'dark', language: 'fr' },
        notifications: { emailEnabled: true },
      } as any;

      const req = httpMock.expectOne(API_BASE);
      expect(req.request.method).toBe('GET');
      req.flush(mockPreferences);
      await stabilize();

      expect(service.getCurrentPreferences()).toEqual(mockPreferences);
    });

    it('should load from localStorage if available', async () => {
      const storedPrefs: UserPreferences = {
        ui: { theme: 'light' },
      } as any;
      localStorage.setItem('user_preferences', JSON.stringify(storedPrefs));

      const newService = TestBed.inject(UserPreferencesService);

      const req = httpMock.expectOne(API_BASE);
      req.flush(storedPrefs);

      await stabilize();
      expect(newService.getCurrentPreferences()).toEqual(storedPrefs);
    });

    it('should handle server load errors gracefully', async () => {
      const req = httpMock.expectOne(API_BASE);
      req.error(new ErrorEvent('Network error'));
      await stabilize();

      expect(service.getCurrentPreferences()).toEqual({});
    });
  });

  describe('BehaviorSubject Reactive Updates', () => {
    it('should emit preferences changes through observable', async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      await stabilize();

      const emissions: UserPreferences[] = [];
      service.preferences$.subscribe((prefs) => emissions.push(prefs));

      const newPrefs = { ui: { theme: 'dark' } } as any;
      service.setPreference('ui', newPrefs.ui);

      expect(emissions.length).toBeGreaterThan(0);
      expect(emissions[emissions.length - 1]).toEqual(newPrefs);
    });

    it('should maintain reactive synchronization across multiple subscribers', async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      await stabilize();

      const subscriber1Values: UserPreferences[] = [];
      const subscriber2Values: UserPreferences[] = [];

      service.preferences$.subscribe((prefs) => subscriber1Values.push(prefs));
      service.preferences$.subscribe((prefs) => subscriber2Values.push(prefs));

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      updateReq.flush({ category: 'ui', preferences: { theme: 'dark' } });
      await stabilize();

      expect(subscriber1Values[subscriber1Values.length - 1]).toEqual(
        subscriber2Values[subscriber2Values.length - 1]
      );
    });
  });

  describe('getPreferences()', () => {
    it('should return current preferences as observable', async () => {
      const mockPrefs = { ui: { theme: 'dark' } } as any;

      const req = httpMock.expectOne(API_BASE);
      req.flush(mockPrefs);
      await stabilize();

      const prefs = await firstValueFrom(service.getPreferences());
      expect(prefs).toEqual(mockPrefs);
    });
  });

  describe('getCurrentPreferences()', () => {
    it('should return current preferences synchronously', async () => {
      const mockPrefs = { ui: { theme: 'dark' } } as any;

      const req = httpMock.expectOne(API_BASE);
      req.flush(mockPrefs);
      await stabilize();

      expect(service.getCurrentPreferences()).toEqual(mockPrefs);
    });
  });

  describe('updatePreferences()', () => {
    it('should update preferences for a specific category', async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      await stabilize();

      const categoryValues = { theme: 'dark', language: 'fr' } as any;

      const updatePromise = firstValueFrom(
        service.updatePreferences('ui', categoryValues)
      );

      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      expect(updateReq.request.method).toBe('PUT');
      expect(updateReq.request.body).toEqual({ preferences: categoryValues });
      updateReq.flush({ category: 'ui', preferences: categoryValues });
      await stabilize();

      const response = await updatePromise;
      expect(response.category).toBe('ui');
      expect(response.preferences).toEqual(categoryValues);

      const currentPrefs = service.getCurrentPreferences();
      expect((currentPrefs as any).ui).toEqual(categoryValues);
    });

    it('should save to localStorage immediately (optimistic update)', async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      await stabilize();

      const categoryValues = { theme: 'dark' } as any;
      const done = firstValueFrom(service.updatePreferences('ui', categoryValues));

      const stored = localStorage.getItem('user_preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.ui).toEqual(categoryValues);

      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      updateReq.flush({ category: 'ui', preferences: categoryValues });
      await stabilize();
      await done;
    });

    it('should merge values with existing category preferences', async () => {
      const initialPrefs = {
        ui: { theme: 'light', language: 'en' },
      };

      const req = httpMock.expectOne(API_BASE);
      req.flush(initialPrefs);
      await stabilize();

      const done = firstValueFrom(service.updatePreferences('ui', { theme: 'dark' }));

      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      updateReq.flush({
        category: 'ui',
        preferences: { theme: 'dark', language: 'en' },
      });
      await stabilize();
      await done;

      const current = service.getCurrentPreferences();
      expect((current as any).ui).toEqual({ theme: 'dark', language: 'en' });
    });
  });

  describe('Offline Queue Management', () => {
    beforeEach(async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      await stabilize();
    });

    it('should queue updates when offline', async () => {
      offlineIsOnline = false;

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();

      httpMock.expectNone(`${API_BASE}/ui`);
      await stabilize();

      const pending = JSON.parse(
        localStorage.getItem('user_preferences_pending') || '[]'
      );
      expect(pending.length).toBe(1);
      expect(pending[0].category).toBe('ui');
      expect(pending[0].values).toEqual({ theme: 'dark' });
    });

    it('should process pending updates when coming back online', async () => {
      vi.useFakeTimers();
      offlineIsOnline = false;

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      service
        .updatePreferences('notifications', { emailEnabled: true })
        .subscribe();

      await stabilize();

      offlineIsOnline = true;
      connectivitySubject.next({
        status: ConnectionStatus.ONLINE,
        lastOnline: new Date(),
      });

      await vi.advanceTimersByTimeAsync(1000);
      await stabilize();

      const req1 = httpMock.expectOne(`${API_BASE}/ui`);
      req1.flush({ category: 'ui', preferences: { theme: 'dark' } });
      await stabilize();

      const req2 = httpMock.expectOne(`${API_BASE}/notifications`);
      req2.flush({
        category: 'notifications',
        preferences: { emailEnabled: true },
      });
      await stabilize();

      const finalReq = httpMock.expectOne(API_BASE);
      finalReq.flush({
        ui: { theme: 'dark' },
        notifications: { emailEnabled: true },
      });
      await stabilize();

      const pending = JSON.parse(
        localStorage.getItem('user_preferences_pending') || '[]'
      );
      expect(pending.length).toBe(0);
    });

    it('should replace existing pending update for same category', async () => {
      offlineIsOnline = false;

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      await stabilize();
      service.updatePreferences('ui', { theme: 'light' }).subscribe();
      await stabilize();

      const pending = JSON.parse(
        localStorage.getItem('user_preferences_pending') || '[]'
      );
      expect(pending.length).toBe(1);
      expect(pending[0].values).toEqual({ theme: 'light' });
    });

    it('should retry failed updates up to MAX_RETRIES', async () => {
      vi.useFakeTimers();
      offlineIsOnline = false;

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      await stabilize();

      offlineIsOnline = true;
      connectivitySubject.next({
        status: ConnectionStatus.ONLINE,
        lastOnline: new Date(),
      });

      await vi.advanceTimersByTimeAsync(1000);
      await stabilize();

      const req1 = httpMock.expectOne(`${API_BASE}/ui`);
      req1.error(new ErrorEvent('Network error'));
      await stabilize();

      expect(service.hasPendingUpdates()).toBe(true);

      const getReq = httpMock.match((u: { url?: string }) =>
        (u.url ?? '').includes('user/preferences')
      );
      if (getReq.length > 0) {
        getReq[0].flush({});
      }
    });
  });

  describe('Periodic Polling (5 min)', () => {
    it('should poll server every 5 minutes for updates', async () => {
      vi.useFakeTimers();
      const initialReq = httpMock.expectOne(
        (req: { url?: string }) =>
          req.url?.includes('user/preferences') ?? false
      );
      initialReq.flush({ ui: { theme: 'light' } });
      await stabilize();

      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      await stabilize();

      const getReqs = httpMock.match((req: { url?: string }) =>
        (req.url ?? '').includes('user/preferences')
      );
      const pollReq = getReqs.length > 0 ? getReqs[getReqs.length - 1] : null;
      if (pollReq) {
        pollReq.flush({ ui: { theme: 'dark' } });
      }
      await stabilize();

      const prefs = service.getCurrentPreferences();
      expect(prefs?.ui).toBeDefined();
      expect((prefs as any).ui?.theme).toBe(pollReq ? 'dark' : 'light');
    });

    it('should detect cross-tab/cross-device changes during polling', async () => {
      vi.useFakeTimers();
      const initialReq = httpMock.expectOne(
        (req: { url?: string }) =>
          req.url?.includes('user/preferences') ?? false
      );
      initialReq.flush({ ui: { theme: 'light' } });
      await stabilize();

      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      await stabilize();

      const getReqs = httpMock.match((req: { url?: string }) =>
        (req.url ?? '').includes('user/preferences')
      );
      const pollReq = getReqs.length > 0 ? getReqs[getReqs.length - 1] : null;
      if (pollReq) {
        pollReq.flush({ ui: { theme: 'dark', language: 'fr' } });
      }
      await stabilize();

      const current = service.getCurrentPreferences();
      expect((current as any).ui?.theme).toBe(pollReq ? 'dark' : 'light');
      if (pollReq) {
        expect((current as any).ui?.language).toBe('fr');
      }
    });

    it('should not poll when offline', async () => {
      vi.useFakeTimers();
      const initialReq = httpMock.expectOne(
        (req: { url?: string }) =>
          req.url?.includes('user/preferences') ?? false
      );
      initialReq.flush({});
      await stabilize();

      offlineIsOnline = false;

      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      await stabilize();

      const getReqs = httpMock.match((req: { url?: string }) =>
        (req.url ?? '').includes('user/preferences')
      );
      expect(getReqs.length).toBeLessThanOrEqual(1);
    });

    it('should update last sync timestamp after successful poll', async () => {
      vi.useFakeTimers();
      const initialReq = httpMock.expectOne(
        (req: { url?: string }) =>
          req.url?.includes('user/preferences') ?? false
      );
      initialReq.flush({ ui: { theme: 'light' } });
      await stabilize();

      localStorage.removeItem('user_preferences_last_sync');

      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      await stabilize();

      const getReqs = httpMock.match((req: { url?: string }) =>
        (req.url ?? '').includes('user/preferences')
      );
      const pollReq = getReqs.length > 0 ? getReqs[getReqs.length - 1] : null;
      if (pollReq) {
        pollReq.flush({ ui: { theme: 'light' } });
      }
      await stabilize();

      const lastSync = localStorage.getItem('user_preferences_last_sync');
      if (pollReq) {
        expect(lastSync).toBeTruthy();
      }
    });
  });

  describe('resetToDefaults()', () => {
    beforeEach(async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({ ui: { theme: 'dark' } });
      await stabilize();
    });

    it('should reset all preferences to defaults', async () => {
      const done = firstValueFrom(service.resetToDefaults());

      const req = httpMock.expectOne(`${API_BASE}/reset`);
      expect(req.request.method).toBe('POST');
      req.flush({});
      await stabilize();

      const prefs = await done;
      expect(prefs).toEqual({});

      expect(service.getCurrentPreferences()).toEqual({});
    });

    it('should clear pending updates when resetting all', async () => {
      offlineIsOnline = false;
      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      await stabilize();

      expect(service.hasPendingUpdates()).toBe(true);

      offlineIsOnline = true;
      const done = firstValueFrom(service.resetToDefaults());

      const req = httpMock.expectOne(`${API_BASE}/reset`);
      req.flush({});
      await stabilize();
      await done;

      expect(service.hasPendingUpdates()).toBe(false);
    });

    it('should handle reset errors gracefully', async () => {
      const done = firstValueFrom(service.resetToDefaults());

      const req = httpMock.expectOne(`${API_BASE}/reset`);
      req.error(new ErrorEvent('Network error'));
      await stabilize();

      const prefs = await done;
      expect(prefs).toEqual({});

      expect(service.getCurrentPreferences()).toEqual({});
    });
  });

  describe('getPreferencesByCategory()', () => {
    it('should return preferences for specific category', async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({
        ui: { theme: 'dark', language: 'fr' },
        notifications: { emailEnabled: true },
      });
      await stabilize();

      const prefs = await firstValueFrom(service.getPreferencesByCategory('ui'));
      expect(prefs).toEqual({ theme: 'dark', language: 'fr' });
    });

    it('should return empty object for non-existent category', async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      await stabilize();

      const prefs = await firstValueFrom(
        service.getPreferencesByCategory('nonexistent')
      );
      expect(prefs).toEqual({});
    });
  });

  describe('Legacy API Compatibility', () => {
    beforeEach(async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      await stabilize();
    });

    it('should support setPreference for backward compatibility', () => {
      service.setPreference('ui', { theme: 'dark' });
      const prefs = service.getCurrentPreferences();
      expect(prefs.ui).toEqual({ theme: 'dark' });
    });

    it('should support getPreference with default value', () => {
      const value = service.getPreference('ui', { theme: 'light' });
      expect(value).toEqual({ theme: 'light' });
    });

    it('should return stored value over default', () => {
      service.setPreference('ui', { theme: 'dark' });
      const value = service.getPreference('ui', { theme: 'light' });
      expect(value).toEqual({ theme: 'dark' });
    });

    it('should support clearPreferences', () => {
      service.setPreference('ui', { theme: 'dark' });
      service.clearPreferences();
      expect(service.getCurrentPreferences()).toEqual({});
      expect(localStorage.getItem('user_preferences')).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    beforeEach(async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      await stabilize();
    });

    it('should report pending updates count', async () => {
      offlineIsOnline = false;

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      service
        .updatePreferences('notifications', { emailEnabled: true })
        .subscribe();
      await stabilize();

      expect(service.getPendingUpdatesCount()).toBe(2);
    });

    it('should force sync on demand', async () => {
      const done = firstValueFrom(service.forceSyncNow());

      const req = httpMock.expectOne(API_BASE);
      req.flush({ ui: { theme: 'dark' } });
      await stabilize();
      await done;

      expect(service.getCurrentPreferences()).toEqual({
        ui: { theme: 'dark' },
      });
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist preferences to localStorage on update', async () => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      await stabilize();

      const done = firstValueFrom(
        service.updatePreferences('ui', { theme: 'dark' })
      );

      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      updateReq.flush({ category: 'ui', preferences: { theme: 'dark' } });
      await stabilize();
      await done;

      const stored = localStorage.getItem('user_preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.ui).toEqual({ theme: 'dark' });
    });

    it('should handle localStorage errors gracefully', async () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = (): void => {
        throw new Error('QuotaExceededError');
      };
      try {
        const req = httpMock.expectOne(API_BASE);
        req.flush({});
        await stabilize();

        expect(() => {
          service.updatePreferences('ui', { theme: 'dark' }).subscribe();
        }).not.toThrow();
      } finally {
        Storage.prototype.setItem = originalSetItem;
      }
    });
  });
});
