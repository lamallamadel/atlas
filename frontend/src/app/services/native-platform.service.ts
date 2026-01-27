import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { App, AppState } from '@capacitor/app';
import { Device, DeviceInfo } from '@capacitor/device';
import { Network, ConnectionStatus } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ScreenReader } from '@capacitor/screen-reader';
import { Share, ShareOptions } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { BehaviorSubject, from, Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface PlatformInfo {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  deviceInfo: DeviceInfo | null;
}

/**
 * Service for native platform capabilities
 * Provides unified interface for device features
 */
@Injectable({
  providedIn: 'root'
})
export class NativePlatformService {
  private readonly isNativePlatform = Capacitor.isNativePlatform();
  private readonly platform = Capacitor.getPlatform();
  
  private readonly networkStatusSubject = new BehaviorSubject<ConnectionStatus | null>(null);
  private readonly appStateSubject = new BehaviorSubject<AppState | null>(null);
  private readonly keyboardSubject = new Subject<KeyboardInfo>();
  private readonly backButtonSubject = new Subject<void>();

  public readonly networkStatus$ = this.networkStatusSubject.asObservable();
  public readonly appState$ = this.appStateSubject.asObservable();
  public readonly keyboard$ = this.keyboardSubject.asObservable();
  public readonly backButton$ = this.backButtonSubject.asObservable();

  constructor() {
    if (this.isNativePlatform) {
      this.initializePlatformListeners();
    }
  }

  /**
   * Initialize platform event listeners
   */
  private async initializePlatformListeners(): Promise<void> {
    // Network status
    Network.addListener('networkStatusChange', (status) => {
      this.networkStatusSubject.next(status);
    });

    const initialNetwork = await Network.getStatus();
    this.networkStatusSubject.next(initialNetwork);

    // App state changes
    App.addListener('appStateChange', (state) => {
      this.appStateSubject.next(state);
    });

    // Keyboard events
    Keyboard.addListener('keyboardWillShow', (info) => {
      this.keyboardSubject.next(info);
    });

    Keyboard.addListener('keyboardDidShow', (info) => {
      this.keyboardSubject.next(info);
    });

    // Hardware back button (Android)
    App.addListener('backButton', () => {
      this.backButtonSubject.next();
    });

    // Deep link handling
    App.addListener('appUrlOpen', (event) => {
      this.handleDeepLink(event.url);
    });
  }

  /**
   * Get platform information
   */
  getPlatformInfo(): Observable<PlatformInfo> {
    if (!this.isNativePlatform) {
      return of({
        isNative: false,
        platform: 'web',
        deviceInfo: null
      });
    }

    return from(Device.getInfo()).pipe(
      map((deviceInfo) => ({
        isNative: true,
        platform: this.platform as 'ios' | 'android',
        deviceInfo
      })),
      catchError(() => of({
        isNative: true,
        platform: this.platform as 'ios' | 'android',
        deviceInfo: null
      }))
    );
  }

  /**
   * Get device info
   */
  getDeviceInfo(): Observable<DeviceInfo | null> {
    if (!this.isNativePlatform) {
      return of(null);
    }

    return from(Device.getInfo()).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get device ID
   */
  getDeviceId(): Observable<string | null> {
    if (!this.isNativePlatform) {
      return of(null);
    }

    return from(Device.getId()).pipe(
      map((result) => result.identifier),
      catchError(() => of(null))
    );
  }

  /**
   * Get battery info
   */
  getBatteryInfo(): Observable<any> {
    if (!this.isNativePlatform) {
      return of(null);
    }

    return from(Device.getBatteryInfo()).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.networkStatusSubject.value?.connected ?? true;
  }

  /**
   * Get network status
   */
  getNetworkStatus(): Observable<ConnectionStatus> {
    if (!this.isNativePlatform) {
      return of({ connected: true, connectionType: 'wifi' });
    }

    return from(Network.getStatus());
  }

  /**
   * Hide splash screen
   */
  hideSplashScreen(): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(SplashScreen.hide()).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Show splash screen
   */
  showSplashScreen(): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(SplashScreen.show()).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Set status bar style
   */
  setStatusBarStyle(style: Style, backgroundColor?: string): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(
      Promise.all([
        StatusBar.setStyle({ style }),
        backgroundColor ? StatusBar.setBackgroundColor({ color: backgroundColor }) : Promise.resolve()
      ])
    ).pipe(
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  /**
   * Hide status bar
   */
  hideStatusBar(): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(StatusBar.hide()).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Show status bar
   */
  showStatusBar(): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(StatusBar.show()).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Hide keyboard
   */
  hideKeyboard(): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(Keyboard.hide()).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Show keyboard
   */
  showKeyboard(): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(Keyboard.show()).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Trigger haptic feedback
   */
  hapticImpact(style: ImpactStyle = ImpactStyle.Medium): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(Haptics.impact({ style })).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Trigger haptic notification
   */
  hapticNotification(type: 'SUCCESS' | 'WARNING' | 'ERROR'): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(Haptics.notification({ type })).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Trigger haptic vibration
   */
  hapticVibrate(duration: number = 300): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(Haptics.vibrate({ duration })).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Check if screen reader is enabled
   */
  isScreenReaderEnabled(): Observable<boolean> {
    if (!this.isNativePlatform) {
      return of(false);
    }

    return from(ScreenReader.isEnabled()).pipe(
      map((result) => result.value),
      catchError(() => of(false))
    );
  }

  /**
   * Speak text using screen reader
   */
  speak(text: string): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(ScreenReader.speak({ value: text })).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Share content
   */
  share(options: ShareOptions): Observable<boolean> {
    if (!this.isNativePlatform) {
      // Fallback to Web Share API
      if (navigator.share) {
        return from(navigator.share({
          title: options.title,
          text: options.text,
          url: options.url
        })).pipe(
          map(() => true),
          catchError(() => of(false))
        );
      }
      return of(false);
    }

    return from(Share.share(options)).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Open URL in browser
   */
  openUrl(url: string): Observable<void> {
    if (!this.isNativePlatform) {
      window.open(url, '_blank');
      return of(undefined);
    }

    return from(Browser.open({ url })).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Close browser
   */
  closeBrowser(): Observable<void> {
    if (!this.isNativePlatform) {
      return of(undefined);
    }

    return from(Browser.close()).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Exit app (Android only)
   */
  exitApp(): void {
    if (this.isNativePlatform) {
      App.exitApp();
    }
  }

  /**
   * Get app info
   */
  getAppInfo(): Observable<any> {
    if (!this.isNativePlatform) {
      return of(null);
    }

    return from(App.getInfo()).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Handle deep links
   */
  private handleDeepLink(url: string): void {
    console.log('Deep link opened:', url);
    
    // Parse WhatsApp callback URLs
    if (url.includes('atlasimmo://whatsapp/callback')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      // Dispatch event for WhatsApp callback handling
      window.dispatchEvent(new CustomEvent('whatsapp-callback', {
        detail: { code, state }
      }));
    }
    
    // Handle other deep link patterns
    if (url.includes('atlasimmo://dossiers/')) {
      const dossierId = url.split('dossiers/')[1]?.split('?')[0];
      if (dossierId) {
        window.location.href = `/dossiers/${dossierId}`;
      }
    }
  }

  /**
   * Check if running on iOS
   */
  isIOS(): boolean {
    return this.platform === 'ios';
  }

  /**
   * Check if running on Android
   */
  isAndroid(): boolean {
    return this.platform === 'android';
  }

  /**
   * Check if running on web
   */
  isWeb(): boolean {
    return this.platform === 'web';
  }

  /**
   * Clean up listeners
   */
  removeAllListeners(): void {
    if (this.isNativePlatform) {
      Network.removeAllListeners();
      App.removeAllListeners();
      Keyboard.removeAllListeners();
    }
  }
}
