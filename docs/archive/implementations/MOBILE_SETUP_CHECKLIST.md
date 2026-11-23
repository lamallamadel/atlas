# 📱 Mobile Native App Setup Checklist

Use this checklist to set up and deploy your native mobile applications.

## Prerequisites

### Development Environment

- [ ] **macOS** (for iOS development)
  - [ ] Xcode 14+ installed
  - [ ] Xcode Command Line Tools installed
  - [ ] CocoaPods installed: `sudo gem install cocoapods`

- [ ] **Android Studio** (for Android development)
  - [ ] Android Studio installed
  - [ ] Android SDK 24+ (Android 7.0+)
  - [ ] Java 17+ (JDK) installed

- [ ] **Node.js**
  - [ ] Node.js 18+ installed
  - [ ] npm or yarn installed

## Initial Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

- [ ] All npm packages installed successfully
- [ ] No dependency conflicts

### 2. Add Native Platforms

```bash
npm run cap:add:ios
npm run cap:add:android
```

- [ ] iOS platform added (creates `ios/` folder)
- [ ] Android platform added (creates `android/` folder)
- [ ] No errors during platform addition

### 3. Build and Sync

```bash
npm run build:mobile
```

- [ ] Angular build successful
- [ ] Capacitor sync successful
- [ ] Web assets copied to native projects

## iOS Configuration

### 4. Configure Info.plist

Edit `frontend/ios/App/App/Info.plist`:

- [ ] Added camera permission description
- [ ] Added photo library permission description
- [ ] Added calendar permission description
- [ ] Added location permission description
- [ ] Added Face ID permission description
- [ ] Added background modes for notifications
- [ ] Added URL schemes for deep linking
- [ ] Added universal links (associated domains)

### 5. Configure Signing

In Xcode (`frontend/ios/App/App.xcworkspace`):

- [ ] Selected development team
- [ ] Configured bundle identifier: `com.atlas.immobilier`
- [ ] Enabled automatic signing (or manual with certificates)
- [ ] Provisioning profiles configured

### 6. Push Notifications (iOS)

- [ ] Enabled Push Notifications capability in Xcode
- [ ] Generated APNs Authentication Key in Apple Developer Portal
- [ ] Downloaded .p8 key file
- [ ] Configured APNs in Firebase Console (if using FCM)

### 7. Build iOS App

```bash
npm run build:ios
```

- [ ] Xcode opens successfully
- [ ] Build succeeds without errors
- [ ] App runs on simulator
- [ ] App runs on physical device

## Android Configuration

### 8. Configure AndroidManifest.xml

Edit `frontend/android/app/src/main/AndroidManifest.xml`:

- [ ] Added camera permission
- [ ] Added calendar permissions
- [ ] Added biometric permissions
- [ ] Added file system permissions
- [ ] Added network state permission
- [ ] Added deep linking intent filters
- [ ] Configured main activity

### 9. Configure build.gradle

Edit `frontend/android/app/build.gradle`:

- [ ] Set applicationId: `com.atlas.immobilier`
- [ ] Set minSdkVersion: 24
- [ ] Set targetSdkVersion: 34
- [ ] Configured signing configs for release
- [ ] Added ProGuard rules

### 10. Firebase Setup (Android)

- [ ] Created Firebase project
- [ ] Added Android app to Firebase project
- [ ] Downloaded `google-services.json`
- [ ] Placed `google-services.json` in `frontend/android/app/`
- [ ] Added google-services plugin to build.gradle

### 11. Generate Keystore

```bash
keytool -genkey -v -keystore release.keystore -alias atlas-key -keyalg RSA -keysize 2048 -validity 10000
```

- [ ] Keystore generated
- [ ] Keystore password saved securely
- [ ] Key alias noted
- [ ] Key password saved securely

### 12. Build Android App

```bash
npm run build:android
```

- [ ] Android Studio opens successfully
- [ ] Build succeeds without errors
- [ ] App runs on emulator
- [ ] App runs on physical device

## Assets & Branding

### 13. Generate App Icons and Splash Screens

Create source files in `frontend/resources/`:

- [ ] `icon.png` (1024x1024) - Main app icon
- [ ] `icon-foreground.png` (1024x1024) - Android adaptive foreground
- [ ] `icon-background.png` (1024x1024) - Android adaptive background
- [ ] `splash.png` (2732x2732) - Splash screen
- [ ] `notification-icon.png` (512x512) - Android notification icon

Generate assets:
```bash
npx capacitor-assets generate
```

- [ ] iOS icons generated
- [ ] Android icons generated
- [ ] Splash screens generated
- [ ] All assets look correct

## Testing

### 14. Functional Testing

- [ ] **Biometric Authentication**
  - [ ] Face ID works (iOS with Face ID)
  - [ ] Touch ID works (iOS with Touch ID)
  - [ ] Fingerprint works (Android)
  - [ ] Fallback to passcode works

- [ ] **Calendar Sync**
  - [ ] Permission request works
  - [ ] Create event works
  - [ ] Update event works
  - [ ] Delete event works
  - [ ] Events appear in native calendar

- [ ] **Push Notifications**
  - [ ] Permission request works
  - [ ] Token registration works
  - [ ] Foreground notifications display
  - [ ] Background notifications display
  - [ ] Notification tap opens correct screen
  - [ ] Notification channels work (Android)

- [ ] **File System**
  - [ ] Save documents offline
  - [ ] Load offline documents
  - [ ] Cache images
  - [ ] Load cached images
  - [ ] File operations work

- [ ] **Platform Features**
  - [ ] Network status detection works
  - [ ] App state changes detected
  - [ ] Device info retrieved
  - [ ] Haptic feedback works
  - [ ] Status bar control works
  - [ ] Share functionality works
  - [ ] Back button works (Android)

- [ ] **Mobile Gestures**
  - [ ] Swipe left/right works
  - [ ] Swipe up/down works
  - [ ] Long press works
  - [ ] Double tap works
  - [ ] Haptic feedback triggers

- [ ] **Deep Linking**
  - [ ] WhatsApp callback URL works
  - [ ] Dossier deep links work
  - [ ] Universal links work

### 15. UI/UX Testing

- [ ] Safe areas respected on notched devices
- [ ] Touch targets are appropriately sized
- [ ] Buttons respond to touch
- [ ] Scrolling is smooth
- [ ] Animations are smooth
- [ ] Keyboard behavior is correct
- [ ] Status bar color is correct
- [ ] Splash screen displays correctly
- [ ] App icon displays correctly
- [ ] App name is correct

### 16. Performance Testing

- [ ] App launch time is acceptable
- [ ] Navigation is smooth
- [ ] Images load efficiently
- [ ] Offline mode works
- [ ] Memory usage is reasonable
- [ ] Battery drain is acceptable
- [ ] Network usage is reasonable

### 17. Compatibility Testing

- [ ] **iOS**
  - [ ] iPhone 13/14/15 (various sizes)
  - [ ] iPad
  - [ ] iOS 13+
  - [ ] Light and dark mode

- [ ] **Android**
  - [ ] Various manufacturers (Samsung, Google, etc.)
  - [ ] Various screen sizes
  - [ ] Android 7.0+
  - [ ] Light and dark mode

## CI/CD Setup

### 18. GitHub Secrets (iOS)

In GitHub repository settings → Secrets:

- [ ] `APPLE_ID` - Apple Developer account email
- [ ] `APPLE_TEAM_ID` - Team ID from Apple Developer
- [ ] `APP_STORE_CONNECT_API_KEY_ID` - App Store Connect API Key ID
- [ ] `APP_STORE_CONNECT_API_ISSUER_ID` - API Key Issuer ID
- [ ] `APP_STORE_CONNECT_API_KEY` - Base64 encoded .p8 key
- [ ] `MATCH_PASSWORD` - Password for match certificates

### 19. GitHub Secrets (Android)

- [ ] `ANDROID_KEYSTORE_BASE64` - Base64 encoded release.keystore
- [ ] `ANDROID_KEYSTORE_PASSWORD` - Keystore password
- [ ] `ANDROID_KEY_ALIAS` - Key alias
- [ ] `ANDROID_KEY_PASSWORD` - Key password
- [ ] `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` - Base64 encoded service account JSON

### 20. Optional Secrets

- [ ] `SLACK_WEBHOOK_URL` - For deployment notifications

### 21. Test CI/CD Pipelines

- [ ] Push to develop branch
- [ ] iOS build runs successfully
- [ ] Android build runs successfully
- [ ] Artifacts are generated

## App Store Submission

### 22. iOS App Store

**App Store Connect Setup:**
- [ ] Created app in App Store Connect
- [ ] Set bundle identifier
- [ ] Added app name
- [ ] Set primary language
- [ ] Configured app categories

**App Information:**
- [ ] Added app description
- [ ] Added keywords
- [ ] Added support URL
- [ ] Added privacy policy URL
- [ ] Added marketing URL (optional)

**Screenshots & Media:**
- [ ] iPhone screenshots (required sizes)
- [ ] iPad screenshots (if supporting iPad)
- [ ] App preview videos (optional)

**App Review Information:**
- [ ] Contact information
- [ ] Demo account credentials (if required)
- [ ] Notes for reviewer

**Version Information:**
- [ ] Copyright
- [ ] Version number
- [ ] Release notes

**Pricing & Availability:**
- [ ] Price tier selected
- [ ] Territories selected
- [ ] Release date configured

**Submit:**
- [ ] All required information completed
- [ ] Submitted for review

### 23. Google Play Store

**Google Play Console Setup:**
- [ ] Created app in Google Play Console
- [ ] Set package name
- [ ] Added app name
- [ ] Set primary language
- [ ] Configured app categories

**Store Listing:**
- [ ] App name
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Screenshots (phone)
- [ ] Screenshots (tablet, optional)
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)

**Content Rating:**
- [ ] Completed content rating questionnaire
- [ ] Received rating

**App Content:**
- [ ] Privacy policy URL
- [ ] Target audience
- [ ] Content declarations

**Pricing & Distribution:**
- [ ] Price selected
- [ ] Countries selected
- [ ] Content rating

**App Releases:**
- [ ] Internal testing (optional)
- [ ] Closed testing (optional)
- [ ] Open testing / Beta (optional)
- [ ] Production release

**Submit:**
- [ ] All required information completed
- [ ] Submitted for review

## Post-Launch

### 24. Monitoring

- [ ] Set up crash reporting (Firebase Crashlytics, Sentry, etc.)
- [ ] Set up analytics (Firebase Analytics, etc.)
- [ ] Monitor app store ratings and reviews
- [ ] Track download numbers
- [ ] Monitor push notification delivery rates
- [ ] Check server logs for API usage

### 25. Maintenance

- [ ] Plan for regular updates
- [ ] Monitor for OS updates (iOS/Android)
- [ ] Update dependencies regularly
- [ ] Address user feedback
- [ ] Fix bugs promptly
- [ ] Add requested features

## Documentation

### 26. Team Handoff

- [ ] Share Apple Developer account access
- [ ] Share Google Play Console access
- [ ] Document keystore location and passwords
- [ ] Document signing certificate passwords
- [ ] Share API keys and credentials
- [ ] Document CI/CD setup
- [ ] Share Firebase project access

### 27. User Documentation

- [ ] Create user guide
- [ ] Add FAQ
- [ ] Create video tutorials (optional)
- [ ] Set up support channel

## Resources

- [ ] Bookmarked [Capacitor Documentation](https://capacitorjs.com/docs)
- [ ] Bookmarked [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [ ] Bookmarked [Material Design Guidelines](https://material.io/design)
- [ ] Bookmarked [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [ ] Bookmarked [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)

## Notes

Use this space to track issues, blockers, or important notes:

```
Date: ___________
Issue: ___________________________________________________________
Resolution: ______________________________________________________

Date: ___________
Issue: ___________________________________________________________
Resolution: ______________________________________________________
```

---

**Completion Status:** _____ / _____ items completed

**Ready for App Store Submission:** ☐ iOS  ☐ Android

**Production Release Date:** ___________
