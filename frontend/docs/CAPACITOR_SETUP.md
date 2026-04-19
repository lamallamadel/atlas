# Capacitor Mobile App Setup Guide

## Prerequisites

### iOS Development
- macOS with Xcode 14+ installed
- iOS 13.0+ target
- Apple Developer account
- CocoaPods installed: `sudo gem install cocoapods`

### Android Development
- Android Studio installed
- Android SDK 24+ (Android 7.0+)
- Java 17+ (JDK)
- Google Play Developer account

## Initial Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Initialize Capacitor (First Time Only)

```bash
# This creates the capacitor.config.ts file (already done)
npm run cap:init
```

### 3. Add Platforms

```bash
# Add iOS platform
npm run cap:add:ios

# Add Android platform
npm run cap:add:android
```

### 4. Build and Sync

```bash
# Build the Angular app and sync with native projects
npm run build:mobile

# Or sync individually
npm run build:prod
npm run cap:sync
```

## Platform-Specific Configuration

### iOS Configuration

#### 1. Configure Info.plist

Add the following keys to `ios/App/App/Info.plist`:

```xml
<!-- Camera permissions -->
<key>NSCameraUsageDescription</key>
<string>Atlas Immobilier needs access to your camera to capture property photos</string>

<!-- Photo library permissions -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Atlas Immobilier needs access to your photo library to select property photos</string>

<!-- Calendar permissions -->
<key>NSCalendarsUsageDescription</key>
<string>Atlas Immobilier needs access to your calendar to sync appointments</string>

<!-- Location permissions -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Atlas Immobilier needs your location to show nearby properties</string>

<!-- Face ID permissions -->
<key>NSFaceIDUsageDescription</key>
<string>Atlas Immobilier uses Face ID for secure authentication</string>

<!-- Push notifications -->
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>

<!-- Deep linking -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>atlasimmo</string>
    </array>
  </dict>
</array>

<!-- Universal Links -->
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:app.atlasimmo.com</string>
</array>
```

#### 2. Configure Push Notifications

1. Enable Push Notifications capability in Xcode
2. Add your APNs key in Apple Developer Console
3. Configure in `capacitor.config.ts`

#### 3. Build for iOS

```bash
# Open Xcode
npm run cap:open:ios

# Or build from command line
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release
```

### Android Configuration

#### 1. Configure AndroidManifest.xml

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Internet permission (already included) -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Camera permission -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Calendar permissions -->
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />

<!-- Biometric permissions -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />

<!-- File system permissions -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Network state -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Deep linking intent filter -->
<activity>
  <!-- ... existing activity config ... -->
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="atlasimmo" />
    <data android:scheme="https"
          android:host="app.atlasimmo.com" />
  </intent-filter>
</activity>
```

#### 2. Configure build.gradle

Update `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.atlas.immobilier"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 3. Build for Android

```bash
# Open Android Studio
npm run cap:open:android

# Or build from command line
cd android
./gradlew assembleDebug  # Debug build
./gradlew assembleRelease  # Release build
./gradlew bundleRelease  # App Bundle for Play Store
```

## Generate App Icons and Splash Screens

### 1. Prepare Assets

Create the following source files in `frontend/resources/`:

- `icon.png` - 1024x1024px app icon
- `icon-foreground.png` - 1024x1024px (Android adaptive icon foreground)
- `icon-background.png` - 1024x1024px (Android adaptive icon background)
- `splash.png` - 2732x2732px splash screen
- `notification-icon.png` - 512x512px (Android notification icon)

### 2. Generate Assets

```bash
# Install Capacitor Assets tool
npm install -g @capacitor/assets

# Generate all icons and splash screens
npx capacitor-assets generate
```

## Deep Linking Setup

### WhatsApp Callback URL

Configure deep linking for WhatsApp OAuth callback:

**iOS**: Add URL scheme in Info.plist (already configured above)

**Android**: Add intent filter in AndroidManifest.xml (already configured above)

**Handle deep links in app**:

The `NativePlatformService` already handles deep link events:

```typescript
// Listen for WhatsApp callback
window.addEventListener('whatsapp-callback', (event: any) => {
  const { code, state } = event.detail;
  // Handle OAuth callback
});
```

## Push Notifications Setup

### iOS (APNs)

1. Create an App ID with Push Notifications capability in Apple Developer Console
2. Generate APNs Authentication Key
3. Configure in Firebase Console or your push service
4. Request permissions in app:

```typescript
import { NativePushNotificationsService } from '@app/services/native-push-notifications.service';

constructor(private pushService: NativePushNotificationsService) {
  this.pushService.requestPermissions().subscribe(result => {
    if (result.granted) {
      this.pushService.register();
    }
  });
}
```

### Android (FCM)

1. Create a Firebase project
2. Add `google-services.json` to `android/app/`
3. Configure in `android/build.gradle`:

```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```

4. Add to `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

5. Initialize notification channels:

```typescript
this.pushService.initializeDefaultChannels();
```

## Biometric Authentication Setup

### Usage

```typescript
import { NativeBiometricService } from '@app/services/native-biometric.service';

constructor(private biometricService: NativeBiometricService) {}

async authenticateWithBiometrics() {
  const availability = await this.biometricService.checkBiometricAvailability().toPromise();
  
  if (availability.available) {
    const result = await this.biometricService.authenticate('Authenticate to access').toPromise();
    
    if (result.success) {
      // Authentication successful
    }
  }
}
```

## Calendar Sync

### Usage

```typescript
import { NativeCalendarService } from '@app/services/native-calendar.service';

constructor(private calendarService: NativeCalendarService) {}

async syncVisit(visit: any) {
  const permission = await this.calendarService.requestPermissions().toPromise();
  
  if (permission.granted) {
    const result = await this.calendarService.syncVisitToCalendar({
      id: visit.id,
      title: visit.title,
      startDate: visit.startDate,
      endDate: visit.endDate,
      address: visit.address
    }).toPromise();
    
    if (result.success) {
      // Synced successfully
    }
  }
}
```

## Offline Document Storage

### Usage

```typescript
import { NativeFilesystemService } from '@app/services/native-filesystem.service';

constructor(private filesystemService: NativeFilesystemService) {}

async saveDocumentOffline(doc: any) {
  const result = await this.filesystemService.saveDocumentOffline(
    doc.id,
    doc.content,
    doc.filename
  ).toPromise();
  
  if (result.success) {
    // Saved successfully
  }
}

async loadOfflineDocument(docId: string, filename: string) {
  const content = await this.filesystemService.getOfflineDocument(
    docId,
    filename
  ).toPromise();
  
  return content;
}
```

## Mobile Gestures

### Usage

```html
<div
  appMobileGestures
  (swipeLeft)="onSwipeLeft($event)"
  (swipeRight)="onSwipeRight($event)"
  (longPress)="onLongPress($event)"
  (doubleTap)="onDoubleTap($event)"
  [enableHaptics]="true">
  Swipeable content
</div>
```

## Testing on Devices

### iOS

```bash
# Build and run on simulator
npm run cap:open:ios
# Then click Run in Xcode

# Run on physical device
# 1. Connect device via USB
# 2. Select device in Xcode
# 3. Click Run
```

### Android

```bash
# Build and run on emulator
npm run cap:open:android
# Then click Run in Android Studio

# Run on physical device
# 1. Enable USB debugging on device
# 2. Connect device via USB
# 3. Select device in Android Studio
# 4. Click Run
```

## CI/CD Deployment

### GitHub Actions Secrets Required

**iOS (TestFlight)**:
- `APPLE_ID` - Apple Developer account email
- `APPLE_TEAM_ID` - Team ID from Apple Developer
- `APP_STORE_CONNECT_API_KEY_ID` - App Store Connect API Key ID
- `APP_STORE_CONNECT_API_ISSUER_ID` - API Key Issuer ID
- `APP_STORE_CONNECT_API_KEY` - Base64 encoded .p8 key
- `MATCH_PASSWORD` - Password for match certificates

**Android (Google Play)**:
- `ANDROID_KEYSTORE_BASE64` - Base64 encoded release keystore
- `ANDROID_KEYSTORE_PASSWORD` - Keystore password
- `ANDROID_KEY_ALIAS` - Key alias
- `ANDROID_KEY_PASSWORD` - Key password
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` - Base64 encoded service account JSON

**Optional**:
- `SLACK_WEBHOOK_URL` - For deployment notifications

### Manual Deployment

#### iOS

```bash
# Install Fastlane
sudo gem install fastlane

# Deploy to TestFlight
cd frontend
fastlane ios beta

# Deploy to App Store
fastlane ios release
```

#### Android

```bash
# Deploy to Play Store Internal Testing
fastlane android internal

# Deploy to Play Store Beta
fastlane android beta

# Deploy to Play Store Production
fastlane android release
```

## Troubleshooting

### iOS Build Issues

```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean and rebuild
cd ios/App
xcodebuild clean
pod deintegrate
pod install
```

### Android Build Issues

```bash
# Clean build
cd android
./gradlew clean

# Invalidate caches
./gradlew --stop
rm -rf .gradle
./gradlew build
```

### Sync Issues

```bash
# Clean and resync
npm run build:prod
npx cap sync
```

## Performance Optimization

1. **Enable ProGuard** (Android) - Already configured in build.gradle
2. **Enable Bitcode** (iOS) - Configure in Xcode build settings
3. **Optimize images** - Use WebP format where possible
4. **Code splitting** - Already configured in Angular
5. **Lazy loading** - Implement route-based lazy loading
6. **Service worker** - Already configured for offline support

## App Store Submission Checklist

### iOS App Store

- [ ] App icons (all sizes generated)
- [ ] Launch screens (all sizes generated)
- [ ] App screenshots (required sizes)
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] App category
- [ ] Age rating
- [ ] Test account credentials

### Google Play Store

- [ ] App icons (all densities generated)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone and tablet)
- [ ] App description (short and full)
- [ ] Privacy policy URL
- [ ] App category
- [ ] Content rating questionnaire
- [ ] Test account credentials

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design for Android](https://material.io/design)
- [Apple Developer Portal](https://developer.apple.com/)
- [Google Play Console](https://play.google.com/console)
