import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.atlas.immobilier',
  appName: 'Atlas Immobilier',
  webDir: 'dist/frontend',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.atlasimmo.local',
    // For development only - remove in production
    // cleartext: true,
    // allowNavigation: ['localhost', '10.0.2.2', '192.168.*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#2c5aa0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#2c5aa0',
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Calendar: {
      // Calendar sync settings
    },
    // Deep linking configuration
    App: {
      // Handle custom URL schemes
    }
  },
  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
    scheme: 'Atlas Immobilier',
    preferredContentMode: 'mobile'
  },
  // Android-specific configuration
  android: {
    buildOptions: {
      keystorePath: '',
      keystorePassword: '',
      keystoreAlias: '',
      keystoreAliasPassword: '',
      releaseType: 'APK'
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  // Handle deep links for WhatsApp callback
  appUrlScheme: 'atlasimmo',
  loggingBehavior: 'production'
};

export default config;
