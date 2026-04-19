# PWA Quick Start Guide

## Getting Started with PWA Features

### 1. Build for Production with PWA

```bash
cd frontend
npm run build:prod
```

This enables:
- Service worker
- Offline caching
- PWA manifest
- Optimized bundles

### 2. Install as PWA

**Chrome/Edge (Desktop & Mobile):**
1. Open app in browser
2. Look for install icon in address bar
3. Click "Install"
4. App appears on desktop/home screen

**Safari (iOS):**
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

**Firefox (Android):**
1. Open app in Firefox
2. Tap menu (⋮)
3. Tap "Install"
4. Tap "Add"

### 3. Enable Push Notifications

```typescript
import { PushNotificationService } from './services/push-notification.service';

// In component
constructor(private pushService: PushNotificationService) {}

async enableNotifications() {
  // Request permission
  const permission = await this.pushService.requestPermission();
  
  if (permission === 'granted') {
    // Subscribe to push
    await this.pushService.subscribeToPush();
    console.log('Notifications enabled!');
  }
}

// Show local notification
async showNotification() {
  await this.pushService.showNotification({
    title: 'Nouveau message',
    body: 'Vous avez reçu un nouveau message',
    icon: '/assets/icons/icon-192x192.png',
    actions: [
      { action: 'view', title: 'Voir' },
      { action: 'dismiss', title: 'Ignorer' }
    ]
  });
}
```

### 4. Enable Biometric Authentication

```typescript
import { BiometricAuthService } from './services/biometric-auth.service';

// In component
constructor(private biometricService: BiometricAuthService) {}

async setupBiometric() {
  // Check if available
  const available = await this.biometricService.isSupported();
  
  if (!available) {
    console.log('Biometric not supported');
    return;
  }
  
  // Register biometric credential
  const result = await this.biometricService.register(
    this.userId,
    this.username
  );
  
  if (result.success) {
    console.log('Biometric registered!');
  }
}

async loginWithBiometric() {
  const result = await this.biometricService.authenticate();
  
  if (result.success) {
    // User authenticated
    this.login();
  }
}
```

### 5. Use Swipeable Cards

```html
<app-swipeable-card
  [leftAction]="{
    icon: 'archive',
    label: 'Archiver',
    color: '#ff9800',
    action: 'archive'
  }"
  [rightAction]="{
    icon: 'done',
    label: 'Terminer',
    color: '#4caf50',
    action: 'complete'
  }"
  (swipeLeft)="archiveDossier(dossier)"
  (swipeRight)="completeDossier(dossier)">
  
  <div class="dossier-card">
    <h4>{{ dossier.leadName }}</h4>
    <p>{{ dossier.leadPhone }}</p>
  </div>
</app-swipeable-card>
```

### 6. Access Offline Content

```typescript
import { OfflineStorageService } from './services/offline-storage.service';

// In component
constructor(private offlineStorage: OfflineStorageService) {}

async loadOfflineDossiers() {
  const dossiers = await this.offlineStorage.getCachedDossiers();
  this.dossiers = dossiers;
}

async cacheDossier(dossier: any) {
  await this.offlineStorage.cacheDossier(dossier);
  console.log('Dossier cached for offline access');
}

async clearCache() {
  await this.offlineStorage.clearDossierCache();
  console.log('Cache cleared');
}
```

### 7. Check PWA Status

```typescript
import { PwaService } from './services/pwa.service';

// In component
constructor(private pwaService: PwaService) {}

ngOnInit() {
  // Check if installed
  this.pwaService.getInstallStatus().subscribe(installed => {
    if (installed) {
      console.log('Running as installed PWA');
    } else {
      console.log('Running in browser');
    }
  });
  
  // Check display mode
  const displayMode = this.pwaService.getDisplayMode();
  console.log('Display mode:', displayMode);
  // 'standalone', 'browser', 'minimal-ui', or 'fullscreen'
  
  // Check if install is available
  if (this.pwaService.isInstallAvailable()) {
    console.log('Can prompt for install');
  }
}

async promptInstall() {
  const installed = await this.pwaService.promptInstall();
  if (installed) {
    console.log('User accepted install');
  }
}
```

## Mobile-Specific Features

### Bottom Navigation

Automatically shown on mobile (< 768px):
- Dashboard
- Dossiers
- Annonces
- Plus

No configuration needed - included in `app-layout.component.html`.

### Touch Targets

All interactive elements automatically meet 48x48px minimum:
```css
button, a, .clickable {
  min-width: 48px !important;
  min-height: 48px !important;
}
```

### Safe Areas

Automatic support for notched devices:
```css
.element {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Mobile Sheets

Use for mobile-friendly dialogs:
```typescript
import { MatBottomSheet } from '@angular/material/bottom-sheet';

constructor(private bottomSheet: MatBottomSheet) {}

openSheet() {
  this.bottomSheet.open(MySheetComponent);
}
```

## Service Worker Commands

### Check Service Worker Status

```typescript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered:', registrations.length);
  registrations.forEach(reg => {
    console.log('Scope:', reg.scope);
    console.log('Active:', !!reg.active);
  });
});
```

### Update Service Worker

```typescript
// Force update
navigator.serviceWorker.getRegistration().then(reg => {
  reg?.update();
});

// Or in component
import { ServiceWorkerRegistrationService } from './services/service-worker-registration.service';

constructor(private swReg: ServiceWorkerRegistrationService) {}

checkForUpdates() {
  this.swReg.checkForUpdates();
}
```

### Clear Cache

```typescript
// Clear all caches
caches.keys().then(names => {
  names.forEach(name => {
    caches.delete(name);
  });
});

// Or use service
import { OfflineStorageService } from './services/offline-storage.service';

constructor(private offlineStorage: OfflineStorageService) {}

async clearAllCaches() {
  await this.offlineStorage.clearDossierCache();
  await this.offlineStorage.clearMessageCache();
}
```

## Testing

### Test Offline Mode

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Refresh page
5. Verify app works offline

### Test PWA Install

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Manifest" section
4. Check manifest details
5. Click "Service Workers" section
6. Verify service worker active

### Test on Real Device

**Android:**
```bash
# Connect device via USB
adb reverse tcp:4200 tcp:4200

# Access on device
http://localhost:4200
```

**iOS:**
- Use ngrok or similar for HTTPS
- Access via Safari

### Test Push Notifications

**Chrome:**
1. Open DevTools
2. Go to Application > Service Workers
3. Find your service worker
4. Click "Push" to simulate push notification

## Common Issues

### Service Worker Not Registering

**Check:**
- Running on HTTPS (or localhost)
- Service worker file accessible
- No JavaScript errors

**Fix:**
```bash
# Clear browser cache
# Hard refresh (Ctrl+Shift+R)
# Check browser console for errors
```

### PWA Not Installable

**Check:**
- Manifest file valid
- Service worker registered
- All required icons present
- HTTPS enabled

**Fix:**
```bash
# Validate manifest
cat src/manifest.json | jq .

# Check Lighthouse PWA audit
# DevTools > Lighthouse > PWA
```

### Push Notifications Not Working

**Check:**
- Permission granted
- VAPID keys configured
- Subscription active

**Fix:**
```typescript
// Check permission
console.log(Notification.permission);

// Re-subscribe
await pushService.subscribeToPush();
```

### App Not Updating

**Fix:**
```typescript
// Force update
navigator.serviceWorker.getRegistration().then(reg => {
  reg?.unregister();
  window.location.reload();
});
```

## Environment Variables

Add to `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: '/api',
  vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY', // For push notifications
  oidc: {
    // ... existing config
  }
};
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

## Build Configuration

Ensure `angular.json` has:

```json
{
  "configurations": {
    "production": {
      "serviceWorker": true,
      "ngswConfigPath": "ngsw-config.json"
    }
  }
}
```

## Resources

- **PWA Docs:** See `PWA_IMPLEMENTATION.md`
- **Service Worker:** `src/service-worker.js`
- **Manifest:** `src/manifest.json`
- **Config:** `ngsw-config.json`

## Support

For issues or questions:
1. Check `PWA_IMPLEMENTATION.md` for detailed docs
2. Check browser console for errors
3. Run Lighthouse PWA audit
4. Check service worker status in DevTools
