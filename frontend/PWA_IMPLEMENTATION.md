# Progressive Web App (PWA) Implementation

## Overview

Atlas Immobilier CRM is now a fully-featured Progressive Web App with offline capabilities, push notifications, biometric authentication, and mobile-optimized layouts.

## Features Implemented

### 1. Service Worker with Offline Capability

**Location:** `src/service-worker.js`

**Features:**
- **Caching Strategies:**
  - Cache-First: Static assets (images, fonts, CSS, JS)
  - Network-First: API calls and dynamic content
  - Stale-While-Revalidate: Assets that can be slightly stale
- **Offline Support:**
  - Recent dossiers cached for offline viewing
  - Recent messages cached for offline viewing
  - Dashboard KPIs cached
- **Cache Management:**
  - Automatic cache cleanup
  - LRU (Least Recently Used) eviction
  - Configurable cache sizes and expiration times

**Configuration:** `ngsw-config.json`
```json
{
  "dataGroups": [
    {
      "name": "api-recent-dossiers",
      "urls": ["/api/v1/dossiers"],
      "cacheConfig": {
        "maxSize": 50,
        "maxAge": "1h",
        "strategy": "freshness"
      }
    }
  ]
}
```

### 2. Web App Manifest

**Location:** `src/manifest.json`

**Features:**
- App name and description
- Icons (72x72 to 512x512, including maskable icons)
- Theme colors (light and dark mode)
- Display mode: standalone
- App shortcuts:
  - Nouveau Dossier
  - Messages
  - Recherche
  - Dashboard
- File handlers for CSV/Excel import
- Share target for document sharing
- Protocol handlers for deep linking

### 3. Push Notification Service

**Location:** `src/app/services/push-notification.service.ts`

**Features:**
- Web Push API integration
- VAPID key authentication
- Permission management
- Subscription management
- Local notifications
- Notification actions
- Backend integration for subscription storage

**Usage:**
```typescript
// Request permission
await pushNotificationService.requestPermission();

// Subscribe to push
await pushNotificationService.subscribeToPush();

// Show local notification
await pushNotificationService.showNotification({
  title: 'Nouveau message',
  body: 'Vous avez reçu un nouveau message',
  icon: '/assets/icons/icon-192x192.png',
  actions: [
    { action: 'view', title: 'Voir' },
    { action: 'dismiss', title: 'Ignorer' }
  ]
});
```

### 4. Biometric Authentication

**Location:** `src/app/services/biometric-auth.service.ts`

**Features:**
- Web Authentication API (WebAuthn)
- Platform authenticator support (Face ID, Touch ID, Windows Hello)
- Credential registration and management
- Authentication flow
- Fallback for unsupported devices

**Usage:**
```typescript
// Check if available
const available = await biometricAuthService.isSupported();

// Register biometric credential
const result = await biometricAuthService.register(userId, username);

// Authenticate with biometric
const authResult = await biometricAuthService.authenticate();

// Unenroll
await biometricAuthService.unenroll();
```

### 5. Mobile-Optimized Layouts

**Components:**
- `mobile-bottom-navigation.component.ts` - Bottom navigation bar
- `swipeable-card.component.ts` - Swipeable cards with actions
- `mobile-action-sheet.component.ts` - Bottom sheets for actions
- `mobile-filter-sheet.component.ts` - Filter bottom sheet

**Styles:** `src/styles/mobile-pwa.css`

**Features:**
- 48x48px minimum touch targets (WCAG AAA)
- Safe area support for notched devices
- Swipe gestures for common actions
- Bottom navigation for easy thumb access
- Mobile-specific card layouts
- Full-screen dialogs on mobile
- Touch-optimized form fields

### 6. Bottom Navigation

**Location:** `src/app/components/mobile-bottom-navigation.component.ts`

**Features:**
- Fixed bottom bar (< 768px screens)
- 4 main navigation items
- Active state indicators
- Badge support for notifications
- Safe area inset support
- Smooth animations

**Items:**
- Tableau de bord
- Dossiers
- Annonces
- Plus (menu)

### 7. Swipe Gestures

**Location:** `src/app/components/swipeable-card.component.ts`

**Features:**
- Left/right swipe actions
- Configurable swipe threshold
- Visual feedback during swipe
- Touch and mouse support
- Smooth animations

**Usage:**
```html
<app-swipeable-card
  [leftAction]="{icon: 'delete', label: 'Supprimer', color: '#f44336', action: 'delete'}"
  [rightAction]="{icon: 'edit', label: 'Modifier', color: '#2196f3', action: 'edit'}"
  (swipeLeft)="handleDelete()"
  (swipeRight)="handleEdit()">
  <!-- Card content -->
</app-swipeable-card>
```

### 8. App Shell Architecture

**Location:** `src/app/components/app-shell.component.ts`

**Features:**
- Instant loading skeleton
- Critical CSS inlined
- Header/content/footer placeholders
- Smooth transition to real content
- Dark theme support

**Benefits:**
- Sub-second perceived load time
- Better user experience
- Reduced bounce rate
- Improved engagement

### 9. PWA Install Prompt

**Location:** `src/app/components/pwa-install-prompt.component.ts`

**Features:**
- Native install prompt capture
- Custom install banner
- Dismissible prompt
- Install tracking
- Mobile and desktop support

**PWA Service:** `src/app/services/pwa.service.ts`
- Install prompt management
- Installation status tracking
- Standalone mode detection
- Display mode detection

### 10. Offline Dossiers Viewer

**Location:** `src/app/components/offline-dossiers-viewer.component.ts`

**Features:**
- View cached dossiers offline
- Swipeable cards for actions
- Cache management
- Status indicators
- Refresh functionality

## Architecture

### Service Worker Lifecycle

```
Install → Activate → Fetch
    ↓         ↓         ↓
Precache  Cleanup   Route to strategy
```

### Caching Strategy Flow

```
Request → Is API? → Network-First
       → Is Image? → Cache-First
       → Is Static? → Cache-First
       → Is Navigation? → Network-First
       → Default → Stale-While-Revalidate
```

### Offline Sync Flow

```
User Action → Queue → Service Worker → Background Sync
                 ↓                          ↓
            IndexedDB              → When Online → Sync
```

## Configuration

### VAPID Keys (Push Notifications)

**Environment files:** `src/environments/environment.ts`, `environment.prod.ts`

```typescript
export const environment = {
  vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY'
};
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

### Service Worker Configuration

**File:** `ngsw-config.json`

```json
{
  "dataGroups": [
    {
      "name": "group-name",
      "urls": ["/api/v1/**"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "10s",
        "strategy": "freshness" // or "performance"
      }
    }
  ]
}
```

### PWA Assets

Required icon sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

Maskable icons:
- 192x192
- 512x512

Screenshots:
- Desktop (wide): 1920x1080
- Mobile (narrow): 750x1334

## Mobile Optimization

### Touch Targets

All interactive elements meet WCAG AAA requirements:
- Minimum size: 48x48px
- Adequate spacing between targets
- Visual feedback on touch

### Safe Areas

Support for notched devices:
```css
.element {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### Performance

- Lazy loading of images
- Code splitting for routes
- Prefetching of critical routes
- Resource hints (preconnect, dns-prefetch)
- Optimized bundle size

## Usage Examples

### Install PWA

**User Flow:**
1. Visit app in browser
2. See install prompt banner
3. Click "Installer"
4. App appears on home screen

**Programmatic:**
```typescript
// Trigger install prompt
await pwaService.promptInstall();

// Check if installed
pwaService.getInstallStatus().subscribe(installed => {
  console.log('Installed:', installed);
});
```

### Enable Push Notifications

**User Flow:**
1. Click notification icon
2. Click "Enable Notifications"
3. Grant permission
4. Receive real-time notifications

**Programmatic:**
```typescript
// Request permission and subscribe
const permission = await pushNotificationService.requestPermission();
if (permission === 'granted') {
  await pushNotificationService.subscribeToPush();
}
```

### Setup Biometric Auth

**User Flow:**
1. Go to Settings
2. Enable "Biometric Authentication"
3. Register fingerprint/face
4. Use biometric for login

**Programmatic:**
```typescript
// Register biometric
const result = await biometricAuthService.register(userId, username);
if (result.success) {
  console.log('Biometric registered');
}

// Authenticate
const authResult = await biometricAuthService.authenticate();
if (authResult.success) {
  // Login user
}
```

### View Offline Content

**User Flow:**
1. Open app while offline
2. See "Offline Mode" indicator
3. Access recent dossiers/messages
4. View cached content

**Programmatic:**
```typescript
// Get cached dossiers
const dossiers = await offlineStorage.getCachedDossiers();

// Cache dossier for offline
await offlineStorage.cacheDossier(dossier);
```

## Testing

### PWA Compliance

**Chrome DevTools:**
1. Open DevTools
2. Go to Lighthouse tab
3. Run PWA audit
4. Check all PWA criteria pass

**Required scores:**
- PWA: 100%
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### Offline Testing

1. Open app
2. Open DevTools > Network
3. Select "Offline" mode
4. Navigate app
5. Verify offline functionality

### Mobile Testing

**Real Device:**
1. Access app on mobile device
2. Install as PWA
3. Test touch targets
4. Test swipe gestures
5. Test safe area support

**Chrome DevTools:**
1. Toggle device toolbar
2. Select mobile device
3. Test responsive layouts
4. Test touch interactions

### Push Notifications

1. Subscribe to push
2. Send test notification from backend
3. Verify notification received
4. Test notification actions

### Biometric Auth

**Requirements:**
- Device with biometric hardware
- HTTPS connection

**Test:**
1. Register biometric credential
2. Close browser
3. Open app
4. Authenticate with biometric

## Browser Support

### PWA Features

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Web App Manifest | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ❌ | ✅ |
| Web Authentication | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ❌ | ✅ | ✅ |

### Fallbacks

- Push Notifications: In-app notifications for Safari
- Install Prompt: Manual instructions for Firefox
- Biometric Auth: Password fallback

## Best Practices

### 1. Cache Strategy Selection

- **Cache-First:** Static assets (images, fonts, CSS, JS)
- **Network-First:** Real-time data (messages, notifications)
- **Stale-While-Revalidate:** Semi-static data (user profile, settings)

### 2. Cache Size Management

- Monitor cache size
- Implement LRU eviction
- Clear old caches on update
- User-controlled cache clearing

### 3. Offline UX

- Clear offline indicators
- Disable unavailable actions
- Queue user actions
- Sync when online

### 4. Performance

- Minimize service worker size
- Avoid blocking main thread
- Use background sync
- Optimize cache queries

### 5. Security

- Use HTTPS
- Validate VAPID keys
- Secure credential storage
- Implement CSP headers

## Troubleshooting

### Service Worker Not Updating

**Solution:**
```typescript
// Force update
await registration.update();

// Skip waiting
self.skipWaiting();
```

### Push Notifications Not Working

**Check:**
1. VAPID keys configured
2. HTTPS enabled
3. Permission granted
4. Subscription active

**Debug:**
```typescript
// Check permission
console.log(Notification.permission);

// Check subscription
const subscription = await registration.pushManager.getSubscription();
console.log(subscription);
```

### Biometric Auth Failing

**Check:**
1. Device has biometric hardware
2. User enrolled biometric
3. HTTPS connection
4. Browser support

**Fallback:**
```typescript
const available = await biometricAuthService.isSupported();
if (!available) {
  // Show password login
}
```

### App Not Installing

**Check:**
1. Web app manifest valid
2. Service worker registered
3. HTTPS enabled
4. Required icons present

**Debug:**
```typescript
// Check manifest
console.log(await navigator.serviceWorker.ready);

// Check install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt available');
});
```

## Future Enhancements

### Planned Features

1. **Background Sync:**
   - Sync queued actions when online
   - Retry failed requests
   - Conflict resolution

2. **Periodic Background Sync:**
   - Fetch new content periodically
   - Update cache in background
   - Notify user of new content

3. **Advanced Caching:**
   - Machine learning for predictive caching
   - User behavior analysis
   - Intelligent prefetching

4. **Web Share API:**
   - Share dossiers
   - Share annonces
   - Share reports

5. **File System Access API:**
   - Save files locally
   - Open files from device
   - Edit files in app

6. **Screen Wake Lock:**
   - Keep screen on during presentations
   - Prevent sleep during long operations

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker Cookbook](https://serviceworke.rs/)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Web Authentication API](https://webauthn.guide/)
