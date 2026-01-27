import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { NativePlatformService } from './native-platform.service';
import { NativePushNotificationsService } from './native-push-notifications.service';
import { NativeBiometricService } from './native-biometric.service';
import { NativeCalendarService } from './native-calendar.service';
import { NativeFilesystemService } from './native-filesystem.service';
import { filter, take } from 'rxjs/operators';

/**
 * Service to initialize native app features on startup
 * Handles platform-specific initialization and deep linking
 */
@Injectable({
  providedIn: 'root'
})
export class NativeAppInitService {
  private readonly isNativePlatform = Capacitor.isNativePlatform();

  constructor(
    private router: Router,
    private platformService: NativePlatformService,
    private pushService: NativePushNotificationsService,
    private biometricService: NativeBiometricService,
    private calendarService: NativeCalendarService,
    private filesystemService: NativeFilesystemService
  ) {}

  /**
   * Initialize native app features
   * Call this in app.component.ts ngOnInit
   */
  async initialize(): Promise<void> {
    if (!this.isNativePlatform) {
      console.log('Running on web platform - native features disabled');
      return;
    }

    console.log('Initializing native app features...');

    try {
      // Initialize platform services
      await this.initializePlatform();

      // Initialize push notifications
      await this.initializePushNotifications();

      // Setup deep link handling
      this.setupDeepLinkHandling();

      // Setup app state monitoring
      this.setupAppStateMonitoring();

      // Setup network monitoring
      this.setupNetworkMonitoring();

      // Setup back button handling (Android)
      this.setupBackButtonHandling();

      // Hide splash screen after initialization
      setTimeout(() => {
        this.platformService.hideSplashScreen().subscribe();
      }, 1000);

      console.log('Native app initialization complete');
    } catch (error) {
      console.error('Error initializing native app:', error);
    }
  }

  /**
   * Initialize platform-specific features
   */
  private async initializePlatform(): Promise<void> {
    const platformInfo = await this.platformService.getPlatformInfo().toPromise();
    console.log('Platform info:', platformInfo);

    // Set status bar style based on platform
    if (platformInfo?.platform === 'ios') {
      this.platformService.setStatusBarStyle('LIGHT', '#2c5aa0').subscribe();
    } else if (platformInfo?.platform === 'android') {
      this.platformService.setStatusBarStyle('LIGHT', '#2c5aa0').subscribe();
    }

    // Get device info for analytics
    const deviceInfo = await this.platformService.getDeviceInfo().toPromise();
    console.log('Device info:', deviceInfo);

    // Store device ID for push notifications
    const deviceId = await this.platformService.getDeviceId().toPromise();
    if (deviceId) {
      localStorage.setItem('deviceId', deviceId);
    }
  }

  /**
   * Initialize push notifications
   */
  private async initializePushNotifications(): Promise<void> {
    // Check permissions
    const permission = await this.pushService.checkPermissions().toPromise();
    
    if (!permission?.granted) {
      // Request permissions on first launch
      const firstLaunch = !localStorage.getItem('appLaunched');
      if (firstLaunch) {
        const result = await this.pushService.requestPermissions().toPromise();
        if (result?.granted) {
          await this.pushService.register().toPromise();
        }
        localStorage.setItem('appLaunched', 'true');
      }
    } else {
      // Already granted, register for notifications
      await this.pushService.register().toPromise();
    }

    // Initialize notification channels (Android)
    this.pushService.initializeDefaultChannels();

    // Listen for push notification token
    this.pushService.token$.pipe(
      filter(token => !!token),
      take(1)
    ).subscribe(token => {
      console.log('Push notification token received:', token);
      // TODO: Send token to backend
      localStorage.setItem('pushToken', token!);
    });

    // Listen for notification actions
    this.pushService.notificationAction$.subscribe(action => {
      console.log('Notification action:', action);
      const route = this.pushService.handleNotificationAction(action);
      if (route) {
        this.router.navigate([route.route], { queryParams: route.params });
      }
    });

    // Listen for foreground notifications
    this.pushService.notificationReceived$.subscribe(notification => {
      console.log('Notification received in foreground:', notification);
      // Show in-app notification or update badge
      this.showInAppNotification(notification);
    });
  }

  /**
   * Setup deep link handling
   */
  private setupDeepLinkHandling(): void {
    // Deep links are handled by NativePlatformService
    // Listen for WhatsApp callback events
    window.addEventListener('whatsapp-callback', (event: any) => {
      const { code, state } = event.detail;
      console.log('WhatsApp callback received:', { code, state });
      
      // Route to WhatsApp integration page with callback params
      this.router.navigate(['/settings/integrations/whatsapp'], {
        queryParams: { code, state }
      });
    });
  }

  /**
   * Setup app state monitoring
   */
  private setupAppStateMonitoring(): void {
    this.platformService.appState$.subscribe(state => {
      if (state?.isActive) {
        console.log('App became active');
        this.onAppForeground();
      } else {
        console.log('App went to background');
        this.onAppBackground();
      }
    });
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    this.platformService.networkStatus$.subscribe(status => {
      if (status) {
        console.log('Network status changed:', status);
        
        if (!status.connected) {
          this.onOffline();
        } else {
          this.onOnline();
        }
      }
    });
  }

  /**
   * Setup Android back button handling
   */
  private setupBackButtonHandling(): void {
    if (this.platformService.isAndroid()) {
      this.platformService.backButton$.subscribe(() => {
        console.log('Hardware back button pressed');
        
        // Check if we can navigate back
        const canGoBack = this.router.url !== '/';
        
        if (canGoBack) {
          this.router.navigate(['..']);
        } else {
          // Confirm exit
          this.confirmExit();
        }
      });
    }
  }

  /**
   * Handle app coming to foreground
   */
  private onAppForeground(): void {
    // Resume biometric authentication if needed
    const biometricPending = sessionStorage.getItem('biometricPending');
    if (biometricPending) {
      this.biometricService.resumeAuthentication().subscribe(result => {
        if (result.success) {
          sessionStorage.removeItem('biometricPending');
        }
      });
    }

    // Sync pending changes
    this.syncPendingChanges();

    // Refresh data if needed
    const lastRefresh = localStorage.getItem('lastDataRefresh');
    const now = Date.now();
    if (!lastRefresh || now - parseInt(lastRefresh) > 5 * 60 * 1000) { // 5 minutes
      this.refreshData();
    }
  }

  /**
   * Handle app going to background
   */
  private onAppBackground(): void {
    // Save any pending changes
    this.savePendingChanges();

    // Clear sensitive data if needed
    const autoLockEnabled = localStorage.getItem('autoLockEnabled') === 'true';
    if (autoLockEnabled) {
      sessionStorage.setItem('biometricPending', 'true');
    }
  }

  /**
   * Handle device going offline
   */
  private onOffline(): void {
    console.log('Device is offline');
    // Show offline indicator
    this.showOfflineMessage();
    
    // Enable offline mode
    localStorage.setItem('offlineMode', 'true');
  }

  /**
   * Handle device coming online
   */
  private onOnline(): void {
    console.log('Device is online');
    // Hide offline indicator
    this.hideOfflineMessage();
    
    // Disable offline mode
    localStorage.removeItem('offlineMode');
    
    // Sync offline changes
    this.syncOfflineChanges();
  }

  /**
   * Sync pending changes with server
   */
  private async syncPendingChanges(): Promise<void> {
    // TODO: Implement sync logic
    console.log('Syncing pending changes...');
  }

  /**
   * Save pending changes locally
   */
  private async savePendingChanges(): Promise<void> {
    // TODO: Implement save logic
    console.log('Saving pending changes...');
  }

  /**
   * Sync offline changes when back online
   */
  private async syncOfflineChanges(): Promise<void> {
    // TODO: Implement offline sync logic
    console.log('Syncing offline changes...');
  }

  /**
   * Refresh app data
   */
  private async refreshData(): Promise<void> {
    // TODO: Implement data refresh logic
    console.log('Refreshing data...');
    localStorage.setItem('lastDataRefresh', Date.now().toString());
  }

  /**
   * Show in-app notification
   */
  private showInAppNotification(notification: any): void {
    // TODO: Show toast or snackbar notification
    console.log('Showing in-app notification:', notification.title);
  }

  /**
   * Show offline message
   */
  private showOfflineMessage(): void {
    // TODO: Show offline indicator in UI
    console.log('Showing offline message');
  }

  /**
   * Hide offline message
   */
  private hideOfflineMessage(): void {
    // TODO: Hide offline indicator in UI
    console.log('Hiding offline message');
  }

  /**
   * Confirm app exit
   */
  private confirmExit(): void {
    // TODO: Show confirmation dialog
    // For now, just exit
    if (confirm('Voulez-vous quitter l\'application ?')) {
      this.platformService.exitApp();
    }
  }

  /**
   * Check and request biometric authentication if enabled
   */
  async checkBiometricAuth(): Promise<boolean> {
    const biometricEnabled = localStorage.getItem('biometricEnabled') === 'true';
    
    if (!biometricEnabled) {
      return true;
    }

    const availability = await this.biometricService.checkBiometricAvailability().toPromise();
    
    if (!availability?.available) {
      return true;
    }

    const result = await this.biometricService.authenticate(
      'Authentifiez-vous pour accéder à l\'application'
    ).toPromise();

    return result?.success || false;
  }

  /**
   * Request calendar sync permission
   */
  async requestCalendarPermission(): Promise<boolean> {
    const result = await this.calendarService.requestPermissions().toPromise();
    return result?.granted || false;
  }

  /**
   * Get platform-specific styles
   */
  getPlatformStyles(): { [key: string]: string } {
    if (this.platformService.isIOS()) {
      return {
        '--safe-area-inset-top': 'env(safe-area-inset-top)',
        '--safe-area-inset-bottom': 'env(safe-area-inset-bottom)'
      };
    }
    return {};
  }
}
