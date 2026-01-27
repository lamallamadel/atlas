# Mobile Native - Quick Reference

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd frontend && npm install

# Build and sync with native platforms
npm run build:mobile

# Open in IDE
npm run cap:open:ios      # Opens Xcode
npm run cap:open:android  # Opens Android Studio

# Development builds
npm run build:ios         # Build and open iOS
npm run build:android     # Build and open Android
```

## 📱 Platform Detection

```typescript
import { Capacitor } from '@capacitor/core';

// Check if native
const isNative = Capacitor.isNativePlatform();

// Check specific platform
const isIOS = Capacitor.getPlatform() === 'ios';
const isAndroid = Capacitor.getPlatform() === 'android';
const isWeb = Capacitor.getPlatform() === 'web';
```

## 🔐 Biometric Authentication

```typescript
import { NativeBiometricService } from '@app/services/native-biometric.service';

constructor(private biometric: NativeBiometricService) {}

async authenticate() {
  // Check availability
  const available = await this.biometric.checkBiometricAvailability().toPromise();
  
  if (available.available) {
    // Authenticate
    const result = await this.biometric.authenticate(
      'Veuillez vous authentifier'
    ).toPromise();
    
    if (result.success) {
      // Success
    }
  }
}
```

## 📅 Calendar Sync

```typescript
import { NativeCalendarService } from '@app/services/native-calendar.service';

constructor(private calendar: NativeCalendarService) {}

async createEvent() {
  // Request permissions
  const permission = await this.calendar.requestPermissions().toPromise();
  
  if (permission.granted) {
    // Create event
    const result = await this.calendar.createEvent({
      title: 'Client Meeting',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
      location: '123 Main St',
      notes: 'Property viewing',
      alertOffsetInMinutes: [15, 60] // Reminders
    }).toPromise();
    
    console.log('Event ID:', result.eventId);
  }
}
```

## 🔔 Push Notifications

```typescript
import { NativePushNotificationsService } from '@app/services/native-push-notifications.service';

constructor(private push: NativePushNotificationsService) {}

ngOnInit() {
  // Listen for notifications
  this.push.notificationReceived$.subscribe(notification => {
    console.log('Notification:', notification.title);
  });
  
  // Listen for notification taps
  this.push.notificationAction$.subscribe(action => {
    const route = this.push.handleNotificationAction(action);
    this.router.navigate([route.route], { queryParams: route.params });
  });
  
  // Get push token
  this.push.token$.subscribe(token => {
    if (token) {
      // Send token to backend
      this.api.registerPushToken(token).subscribe();
    }
  });
}

async setupNotifications() {
  // Request permissions
  const permission = await this.push.requestPermissions().toPromise();
  
  if (permission.granted) {
    // Register
    await this.push.register().toPromise();
    
    // Initialize channels (Android)
    this.push.initializeDefaultChannels();
  }
}
```

## 💾 File System

```typescript
import { NativeFilesystemService } from '@app/services/native-filesystem.service';

constructor(private fs: NativeFilesystemService) {}

async saveDocument(doc: any) {
  // Save offline
  const result = await this.fs.saveDocumentOffline(
    doc.id,
    doc.content,
    doc.filename
  ).toPromise();
  
  if (result.success) {
    console.log('Saved to:', result.path);
  }
}

async loadDocument(docId: string, filename: string) {
  const content = await this.fs.getOfflineDocument(docId, filename).toPromise();
  return content;
}

async cacheImage(url: string) {
  // Fetch image
  const response = await fetch(url);
  const blob = await response.blob();
  
  // Cache it
  const result = await this.fs.cacheImage(url, blob).toPromise();
  
  if (result.success) {
    // Get cached URI
    const uri = await this.fs.getCachedImage(url).toPromise();
    return uri;
  }
}
```

## 🎯 Platform Services

```typescript
import { NativePlatformService } from '@app/services/native-platform.service';

constructor(private platform: NativePlatformService) {}

ngOnInit() {
  // Network monitoring
  this.platform.networkStatus$.subscribe(status => {
    if (!status.connected) {
      this.showOfflineMode();
    }
  });
  
  // App state monitoring
  this.platform.appState$.subscribe(state => {
    if (state.isActive) {
      this.refreshData();
    }
  });
  
  // Back button (Android)
  this.platform.backButton$.subscribe(() => {
    this.goBack();
  });
}

async platformActions() {
  // Haptic feedback
  await this.platform.hapticImpact('Medium').toPromise();
  await this.platform.hapticNotification('SUCCESS').toPromise();
  
  // Share
  await this.platform.share({
    title: 'Check this out',
    text: 'Great property!',
    url: 'https://example.com'
  }).toPromise();
  
  // Open URL
  await this.platform.openUrl('https://example.com').toPromise();
  
  // Status bar
  await this.platform.setStatusBarStyle('LIGHT', '#2c5aa0').toPromise();
  
  // Hide keyboard
  await this.platform.hideKeyboard().toPromise();
}
```

## 👆 Mobile Gestures

```html
<div
  appMobileGestures
  (swipeLeft)="nextItem()"
  (swipeRight)="previousItem()"
  (longPress)="showContextMenu($event)"
  (doubleTap)="zoomIn()"
  [enableHaptics]="true">
  Content
</div>
```

```typescript
nextItem() {
  // Navigate to next
}

showContextMenu(event: TouchEvent) {
  // Show menu at touch location
}
```

## 🎨 Mobile Styles

```html
<!-- Safe area support -->
<div class="safe-area-all">Content</div>

<!-- Touch-optimized button -->
<button class="btn-touch">Button</button>

<!-- Native header -->
<header class="native-header">
  <button class="back-button">
    <mat-icon>arrow_back</mat-icon>
  </button>
  <h1 class="title">Title</h1>
</header>

<!-- Bottom navigation -->
<nav class="bottom-nav">
  <a class="nav-item active">
    <mat-icon>home</mat-icon>
    <span>Home</span>
  </a>
</nav>

<!-- FAB -->
<button class="fab">
  <mat-icon>add</mat-icon>
</button>

<!-- Bottom sheet -->
<div class="mobile-backdrop" [class.visible]="show"></div>
<div class="bottom-sheet" [class.visible]="show">
  <div class="handle"></div>
  <div class="content">...</div>
</div>

<!-- Mobile scroll -->
<div class="mobile-scroll">
  Scrollable content
</div>
```

## 🔗 Deep Linking

```typescript
// Listen for WhatsApp callback
window.addEventListener('whatsapp-callback', (event: any) => {
  const { code, state } = event.detail;
  // Handle OAuth callback
});

// URLs handled automatically:
// atlasimmo://whatsapp/callback?code=XXX&state=YYY
// atlasimmo://dossiers/{id}
```

## 🏗️ Build & Deploy

```bash
# Build production
npm run build:prod

# Sync with platforms
npm run cap:sync

# Platform-specific sync
npm run cap:sync:ios
npm run cap:sync:android

# Update Capacitor
npm run cap:update

# Copy web assets only
npm run cap:copy
```

## 🧪 Testing

```bash
# Build and test on iOS simulator
npm run cap:open:ios
# Then click Run in Xcode

# Build and test on Android emulator
npm run cap:open:android
# Then click Run in Android Studio

# Test deep link (iOS)
xcrun simctl openurl booted "atlasimmo://dossiers/123"

# Test deep link (Android)
adb shell am start -W -a android.intent.action.VIEW -d "atlasimmo://dossiers/123"
```

## 🐛 Debugging

```typescript
// Log only in development
if (!environment.production) {
  console.log('Debug info:', data);
}

// Platform-specific debugging
if (Capacitor.isNativePlatform()) {
  console.log('Native platform:', Capacitor.getPlatform());
  
  // Device info
  this.platform.getDeviceInfo().subscribe(info => {
    console.log('Device:', info);
  });
}
```

## 📦 Asset Management

```bash
# Prepare source assets in resources/
# - icon.png (1024x1024)
# - splash.png (2732x2732)
# - icon-foreground.png (1024x1024, Android)
# - icon-background.png (1024x1024, Android)

# Generate all assets
npx capacitor-assets generate
```

## 🔧 Configuration

### capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.atlas.immobilier',
  appName: 'Atlas Immobilier',
  webDir: 'dist/frontend',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2c5aa0'
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#2c5aa0'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
```

## 🔑 Environment Variables

```typescript
// environment.ts
export const environment = {
  production: false,
  apiBaseUrl: '/api',
  enableBiometric: true,
  enablePushNotifications: true,
  enableCalendarSync: true
};
```

## 📝 Common Patterns

### Check and Request Permission

```typescript
async checkPermission(service: any, action: string) {
  const permission = await service.checkPermissions().toPromise();
  
  if (!permission.granted) {
    const result = await service.requestPermissions().toPromise();
    
    if (!result.granted) {
      this.showPermissionDeniedMessage(action);
      return false;
    }
  }
  
  return true;
}
```

### Retry with Exponential Backoff

```typescript
async retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Safe Area Aware Component

```typescript
@Component({
  selector: 'app-page',
  template: `
    <div class="page-container safe-area-all">
      <header class="native-header">...</header>
      <main>...</main>
    </div>
  `
})
export class PageComponent {}
```

## 🚨 Error Handling

```typescript
try {
  const result = await this.nativeService.doSomething().toPromise();
  
  if (!result.success) {
    this.handleError(result.error);
  }
} catch (error) {
  console.error('Native operation failed:', error);
  
  // Fallback to web implementation
  if (Capacitor.isNativePlatform()) {
    this.useWebFallback();
  }
}
```

## 📚 More Info

- Full setup guide: `CAPACITOR_SETUP.md`
- Complete documentation: `MOBILE_NATIVE_README.md`
- Capacitor docs: https://capacitorjs.com/docs
