# UserPreferencesService - Quick Reference

## Import
```typescript
import { UserPreferencesService } from './services/user-preferences.service';
import { UserPreferences } from '../models/user-preferences.model';
```

## Injection
```typescript
constructor(private preferencesService: UserPreferencesService) {}
```

## API Methods

### Read Operations

| Method | Return Type | Description |
|--------|-------------|-------------|
| `preferences$` | `Observable<UserPreferences>` | Observable stream of all preferences (reactive) |
| `getPreferences()` | `Observable<UserPreferences>` | Get all preferences as observable |
| `getCurrentPreferences()` | `UserPreferences` | Get current preferences synchronously |
| `getPreferencesByCategory(category)` | `Observable<Record<string, unknown>>` | Get preferences for specific category |
| `getCurrentPreferencesByCategory(category)` | `Record<string, unknown>` | Get category preferences synchronously |

### Write Operations

| Method | Return Type | Description |
|--------|-------------|-------------|
| `updatePreferences(category, values)` | `Observable<CategoryPreferencesResponse>` | Update category preferences |
| `resetToDefaults(category?)` | `Observable<UserPreferences>` | Reset to defaults (all or by category) |

### Offline Management

| Method | Return Type | Description |
|--------|-------------|-------------|
| `hasPendingUpdates()` | `boolean` | Check if there are pending offline updates |
| `getPendingUpdatesCount()` | `number` | Get count of pending updates |
| `forceSyncNow()` | `Observable<any>` | Force immediate synchronization |

### Legacy API (Backward Compatibility)

| Method | Return Type | Description |
|--------|-------------|-------------|
| `setPreference(key, value)` | `void` | Set a preference (legacy) |
| `getPreference(key, defaultValue?)` | `any` | Get a preference (legacy) |
| `clearPreferences()` | `void` | Clear all preferences |

## Common Usage Patterns

### 1. Subscribe to Preferences (Reactive)
```typescript
ngOnInit(): void {
  this.preferencesService.preferences$
    .pipe(takeUntil(this.destroy$))
    .subscribe(prefs => {
      this.theme = prefs.ui?.theme || 'light';
      this.language = prefs.ui?.language || 'fr';
    });
}
```

### 2. Update Preferences
```typescript
updateTheme(theme: string): void {
  this.preferencesService.updatePreferences('ui', { theme })
    .subscribe(() => console.log('Theme updated'));
}
```

### 3. Get Current Value (Synchronous)
```typescript
const currentTheme = this.preferencesService.getCurrentPreferences().ui?.theme;
```

### 4. Reset to Defaults
```typescript
resetAllSettings(): void {
  this.preferencesService.resetToDefaults()
    .subscribe(() => console.log('Reset complete'));
}
```

### 5. Check Offline Status
```typescript
if (this.preferencesService.hasPendingUpdates()) {
  const count = this.preferencesService.getPendingUpdatesCount();
  console.log(`${count} updates pending`);
}
```

## Categories

| Category | Properties |
|----------|-----------|
| `ui` | theme, language, dossierViewMode, sidebarCollapsed, dashboardLayout, widgetSettings, density, animationsEnabled |
| `notifications` | emailEnabled, pushEnabled, smsEnabled, inAppEnabled, soundEnabled, desktopEnabled, channels |
| `formats` | dateFormat, timeFormat, numberFormat, currency, timezone, firstDayOfWeek |
| `shortcuts` | Custom key-value pairs for keyboard shortcuts |

## Features

✅ **Reactive Updates**: BehaviorSubject broadcasts changes to all subscribers  
✅ **Offline Support**: Queues updates when offline, syncs when back online  
✅ **Cross-tab Sync**: Detects changes from other tabs (5-min polling)  
✅ **Cross-device Sync**: Detects changes from other devices (5-min polling)  
✅ **Optimistic Updates**: UI updates immediately, server sync in background  
✅ **Auto Retry**: Retries failed updates up to 3 times  
✅ **LocalStorage Cache**: Persists preferences locally for fast loading  

## Configuration

| Constant | Value | Description |
|----------|-------|-------------|
| `POLLING_INTERVAL` | 5 min | Frequency of server polling |
| `MAX_RETRIES` | 3 | Maximum retry attempts for failed updates |
| `RETRY_DELAY` | 5000ms | Delay between retry attempts |

## LocalStorage Keys

| Key | Purpose |
|-----|---------|
| `user_preferences` | Main preferences cache |
| `user_preferences_pending` | Offline update queue |
| `user_preferences_last_sync` | Timestamp of last sync |

## Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/user/preferences` | Get all preferences |
| GET | `/api/v1/user/preferences/{category}` | Get category preferences |
| PUT | `/api/v1/user/preferences/{category}` | Update category preferences |
| POST | `/api/v1/user/preferences/reset` | Reset to defaults |

## Best Practices

✅ **Always unsubscribe** using `takeUntil(this.destroy$)`  
✅ **Use category-based updates** for atomic operations  
✅ **Subscribe to `preferences$`** for reactive updates  
✅ **Handle offline gracefully** using `hasPendingUpdates()`  

❌ **Don't mutate** preferences object directly  
❌ **Don't forget** to clean up subscriptions  
❌ **Don't bypass** the service API  

## Example Component

```typescript
export class SettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  theme = 'light';

  constructor(private prefs: UserPreferencesService) {}

  ngOnInit(): void {
    this.prefs.preferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.theme = p.ui?.theme || 'light');
  }

  updateTheme(newTheme: string): void {
    this.prefs.updatePreferences('ui', { theme: newTheme }).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Preferences not syncing | Check network, verify `hasPendingUpdates()`, use `forceSyncNow()` |
| Polling not working | Verify online status, check 5-min interval, ensure service not destroyed |
| Memory leaks | Always use `takeUntil()` for subscriptions |
| LocalStorage full | Preferences are ~10-50KB, check quota, use `clearPreferences()` |

## Related Files

- Service: `frontend/src/app/services/user-preferences.service.ts`
- Models: `frontend/src/app/models/user-preferences.model.ts`
- Tests: `frontend/src/app/services/user-preferences.service.spec.ts`
- Full Docs: `frontend/src/app/services/USER_PREFERENCES_README.md`
