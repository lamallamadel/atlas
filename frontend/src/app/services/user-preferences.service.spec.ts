import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserPreferencesService, UserPreferences, PendingUpdate } from './user-preferences.service';
import { OfflineService, ConnectionStatus } from './offline.service';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let httpMock: HttpTestingController;
  let offlineService: jasmine.SpyObj<OfflineService>;
  let connectivitySubject: BehaviorSubject<any>;

  const API_BASE = `${environment.apiBaseUrl}/v1/user/preferences`;

  beforeEach(() => {
    connectivitySubject = new BehaviorSubject({
      status: ConnectionStatus.ONLINE,
      lastOnline: new Date()
    });

    offlineService = jasmine.createSpyObj('OfflineService', ['isOnline'], {
      connectivity$: connectivitySubject.asObservable()
    });
    offlineService.isOnline.and.returnValue(true);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserPreferencesService,
        { provide: OfflineService, useValue: offlineService }
      ]
    });

    service = TestBed.inject(UserPreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load preferences from server on initialization', fakeAsync(() => {
      const mockPreferences = {
        ui: { theme: 'dark', language: 'fr' },
        notifications: { emailEnabled: true }
      };

      const req = httpMock.expectOne(API_BASE);
      expect(req.request.method).toBe('GET');
      req.flush(mockPreferences);
      tick();

      service.getPreferences().subscribe(prefs => {
        expect(prefs).toEqual(mockPreferences);
      });
    }));

    it('should load from localStorage if available', () => {
      const storedPrefs: UserPreferences = {
        ui: { theme: 'light' }
      };
      localStorage.setItem('user_preferences', JSON.stringify(storedPrefs));

      const newService = TestBed.inject(UserPreferencesService);
      
      const req = httpMock.expectOne(API_BASE);
      req.flush({});

      expect(newService.getCurrentPreferences()).toEqual(storedPrefs);
    });

    it('should handle server load errors gracefully', fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.error(new ErrorEvent('Network error'));
      tick();

      expect(service.getCurrentPreferences()).toEqual({});
    }));
  });

  describe('BehaviorSubject Reactive Updates', () => {
    it('should emit preferences changes through observable', fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();

      const emissions: UserPreferences[] = [];
      service.preferences$.subscribe(prefs => emissions.push(prefs));

      const newPrefs = { ui: { theme: 'dark' } };
      service.setPreference('ui', newPrefs.ui);

      expect(emissions.length).toBeGreaterThan(0);
      expect(emissions[emissions.length - 1]).toEqual(newPrefs);
    }));

    it('should maintain reactive synchronization across multiple subscribers', fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();

      const subscriber1Values: UserPreferences[] = [];
      const subscriber2Values: UserPreferences[] = [];

      service.preferences$.subscribe(prefs => subscriber1Values.push(prefs));
      service.preferences$.subscribe(prefs => subscriber2Values.push(prefs));

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      updateReq.flush({ category: 'ui', preferences: { theme: 'dark' } });
      tick();

      expect(subscriber1Values[subscriber1Values.length - 1]).toEqual(
        subscriber2Values[subscriber2Values.length - 1]
      );
    }));
  });

  describe('getPreferences()', () => {
    it('should return current preferences as observable', fakeAsync(() => {
      const mockPrefs = { ui: { theme: 'dark' } };
      
      const req = httpMock.expectOne(API_BASE);
      req.flush(mockPrefs);
      tick();

      service.getPreferences().subscribe(prefs => {
        expect(prefs).toEqual(mockPrefs);
      });
    }));
  });

  describe('getCurrentPreferences()', () => {
    it('should return current preferences synchronously', fakeAsync(() => {
      const mockPrefs = { ui: { theme: 'dark' } };
      
      const req = httpMock.expectOne(API_BASE);
      req.flush(mockPrefs);
      tick();

      expect(service.getCurrentPreferences()).toEqual(mockPrefs);
    }));
  });

  describe('updatePreferences()', () => {
    it('should update preferences for a specific category', fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();

      const categoryValues = { theme: 'dark', language: 'fr' };
      
      service.updatePreferences('ui', categoryValues).subscribe(response => {
        expect(response.category).toBe('ui');
        expect(response.preferences).toEqual(categoryValues);
      });

      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      expect(updateReq.request.method).toBe('PUT');
      expect(updateReq.request.body).toEqual({ preferences: categoryValues });
      updateReq.flush({ category: 'ui', preferences: categoryValues });
      tick();

      const currentPrefs = service.getCurrentPreferences();
      expect((currentPrefs as any).ui).toEqual(categoryValues);
    }));

    it('should save to localStorage immediately (optimistic update)', fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();

      const categoryValues = { theme: 'dark' };
      service.updatePreferences('ui', categoryValues).subscribe();

      const stored = localStorage.getItem('user_preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.ui).toEqual(categoryValues);

      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      updateReq.flush({ category: 'ui', preferences: categoryValues });
      tick();
    }));

    it('should merge values with existing category preferences', fakeAsync(() => {
      const initialPrefs = {
        ui: { theme: 'light', language: 'en' }
      };

      const req = httpMock.expectOne(API_BASE);
      req.flush(initialPrefs);
      tick();

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();

      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      updateReq.flush({ category: 'ui', preferences: { theme: 'dark' } });
      tick();

      const current = service.getCurrentPreferences();
      expect((current as any).ui).toEqual({ theme: 'dark', language: 'en' });
    }));
  });

  describe('Offline Queue Management', () => {
    beforeEach(fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();
    }));

    it('should queue updates when offline', fakeAsync(() => {
      offlineService.isOnline.and.returnValue(false);

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      
      httpMock.expectNone(`${API_BASE}/ui`);
      tick();

      const pending = JSON.parse(localStorage.getItem('user_preferences_pending') || '[]');
      expect(pending.length).toBe(1);
      expect(pending[0].category).toBe('ui');
      expect(pending[0].values).toEqual({ theme: 'dark' });
    }));

    it('should process pending updates when coming back online', fakeAsync(() => {
      offlineService.isOnline.and.returnValue(false);

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      service.updatePreferences('notifications', { emailEnabled: true }).subscribe();
      
      tick();

      offlineService.isOnline.and.returnValue(true);
      connectivitySubject.next({
        status: ConnectionStatus.ONLINE,
        lastOnline: new Date()
      });
      
      tick(1000);

      const req1 = httpMock.expectOne(`${API_BASE}/ui`);
      req1.flush({ category: 'ui', preferences: { theme: 'dark' } });
      tick();

      const req2 = httpMock.expectOne(`${API_BASE}/notifications`);
      req2.flush({ category: 'notifications', preferences: { emailEnabled: true } });
      tick();

      const finalReq = httpMock.expectOne(API_BASE);
      finalReq.flush({
        ui: { theme: 'dark' },
        notifications: { emailEnabled: true }
      });
      tick();

      const pending = JSON.parse(localStorage.getItem('user_preferences_pending') || '[]');
      expect(pending.length).toBe(0);
    }));

    it('should replace existing pending update for same category', fakeAsync(() => {
      offlineService.isOnline.and.returnValue(false);

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      tick();
      service.updatePreferences('ui', { theme: 'light' }).subscribe();
      tick();

      const pending = JSON.parse(localStorage.getItem('user_preferences_pending') || '[]');
      expect(pending.length).toBe(1);
      expect(pending[0].values).toEqual({ theme: 'light' });
    }));

    it('should retry failed updates up to MAX_RETRIES', fakeAsync(() => {
      offlineService.isOnline.and.returnValue(false);

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      tick();

      offlineService.isOnline.and.returnValue(true);
      connectivitySubject.next({
        status: ConnectionStatus.ONLINE,
        lastOnline: new Date()
      });
      
      tick(1000);

      const req1 = httpMock.expectOne(`${API_BASE}/ui`);
      req1.error(new ErrorEvent('Network error'));
      tick();

      expect(service.hasPendingUpdates()).toBe(true);
    }));
  });

  describe('Periodic Polling (5 min)', () => {
    it('should poll server every 5 minutes for updates', fakeAsync(() => {
      const initialReq = httpMock.expectOne(API_BASE);
      initialReq.flush({ ui: { theme: 'light' } });
      tick();

      tick(5 * 60 * 1000);

      const pollReq = httpMock.expectOne(API_BASE);
      pollReq.flush({ ui: { theme: 'dark' } });
      tick();

      expect(service.getCurrentPreferences()).toEqual({ ui: { theme: 'dark' } });
    }));

    it('should detect cross-tab/cross-device changes during polling', fakeAsync(() => {
      const initialReq = httpMock.expectOne(API_BASE);
      initialReq.flush({ ui: { theme: 'light' } });
      tick();

      tick(5 * 60 * 1000);

      const pollReq = httpMock.expectOne(API_BASE);
      pollReq.flush({ ui: { theme: 'dark', language: 'fr' } });
      tick();

      const current = service.getCurrentPreferences();
      expect((current as any).ui.theme).toBe('dark');
      expect((current as any).ui.language).toBe('fr');
    }));

    it('should not poll when offline', fakeAsync(() => {
      const initialReq = httpMock.expectOne(API_BASE);
      initialReq.flush({});
      tick();

      offlineService.isOnline.and.returnValue(false);

      tick(5 * 60 * 1000);

      httpMock.expectNone(API_BASE);
    }));

    it('should update last sync timestamp after successful poll', fakeAsync(() => {
      const initialReq = httpMock.expectOne(API_BASE);
      initialReq.flush({ ui: { theme: 'light' } });
      tick();

      localStorage.removeItem('user_preferences_last_sync');

      tick(5 * 60 * 1000);

      const pollReq = httpMock.expectOne(API_BASE);
      pollReq.flush({ ui: { theme: 'light' } });
      tick();

      const lastSync = localStorage.getItem('user_preferences_last_sync');
      expect(lastSync).toBeTruthy();
    }));
  });

  describe('resetToDefaults()', () => {
    beforeEach(fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({ ui: { theme: 'dark' } });
      tick();
    }));

    it('should reset all preferences to defaults', fakeAsync(() => {
      service.resetToDefaults().subscribe(prefs => {
        expect(prefs).toEqual({});
      });

      const req = httpMock.expectOne(`${API_BASE}/reset`);
      expect(req.request.method).toBe('POST');
      req.flush({});
      tick();

      expect(service.getCurrentPreferences()).toEqual({});
    }));

    it('should clear pending updates when resetting all', fakeAsync(() => {
      offlineService.isOnline.and.returnValue(false);
      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      tick();

      expect(service.hasPendingUpdates()).toBe(true);

      offlineService.isOnline.and.returnValue(true);
      service.resetToDefaults().subscribe();

      const req = httpMock.expectOne(`${API_BASE}/reset`);
      req.flush({});
      tick();

      expect(service.hasPendingUpdates()).toBe(false);
    }));

    it('should handle reset errors gracefully', fakeAsync(() => {
      service.resetToDefaults().subscribe(prefs => {
        expect(prefs).toEqual({});
      });

      const req = httpMock.expectOne(`${API_BASE}/reset`);
      req.error(new ErrorEvent('Network error'));
      tick();

      expect(service.getCurrentPreferences()).toEqual({});
    }));
  });

  describe('getPreferencesByCategory()', () => {
    it('should return preferences for specific category', fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({
        ui: { theme: 'dark', language: 'fr' },
        notifications: { emailEnabled: true }
      });
      tick();

      service.getPreferencesByCategory('ui').subscribe(prefs => {
        expect(prefs).toEqual({ theme: 'dark', language: 'fr' });
      });
    }));

    it('should return empty object for non-existent category', fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();

      service.getPreferencesByCategory('nonexistent').subscribe(prefs => {
        expect(prefs).toEqual({});
      });
    }));
  });

  describe('Legacy API Compatibility', () => {
    beforeEach(fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();
    }));

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
    beforeEach(fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();
    }));

    it('should report pending updates count', fakeAsync(() => {
      offlineService.isOnline.and.returnValue(false);

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      service.updatePreferences('notifications', { emailEnabled: true }).subscribe();
      tick();

      expect(service.getPendingUpdatesCount()).toBe(2);
    }));

    it('should force sync on demand', fakeAsync(() => {
      service.forceSyncNow().subscribe();
      
      const req = httpMock.expectOne(API_BASE);
      req.flush({ ui: { theme: 'dark' } });
      tick();

      expect(service.getCurrentPreferences()).toEqual({ ui: { theme: 'dark' } });
    }));
  });

  describe('LocalStorage Persistence', () => {
    it('should persist preferences to localStorage on update', fakeAsync(() => {
      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();

      service.updatePreferences('ui', { theme: 'dark' }).subscribe();

      const updateReq = httpMock.expectOne(`${API_BASE}/ui`);
      updateReq.flush({ category: 'ui', preferences: { theme: 'dark' } });
      tick();

      const stored = localStorage.getItem('user_preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.ui).toEqual({ theme: 'dark' });
    }));

    it('should handle localStorage errors gracefully', fakeAsync(() => {
      spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');

      const req = httpMock.expectOne(API_BASE);
      req.flush({});
      tick();

      expect(() => {
        service.updatePreferences('ui', { theme: 'dark' }).subscribe();
      }).not.toThrow();
    }));
  });
});
