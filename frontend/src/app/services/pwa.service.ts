import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private showInstallPrompt$ = new BehaviorSubject<boolean>(false);
  private isInstalled$ = new BehaviorSubject<boolean>(false);
  private isStandalone$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.init();
  }

  private init(): void {
    // Check if already installed
    this.checkInstallStatus();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      
      // Show install prompt if not dismissed before
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        this.showInstallPrompt$.next(true);
      }
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.deferredPrompt = null;
      this.showInstallPrompt$.next(false);
      this.isInstalled$.next(true);
      localStorage.removeItem('pwa_install_dismissed');
    });
  }

  private checkInstallStatus(): void {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    this.isStandalone$.next(isStandalone);
    this.isInstalled$.next(isStandalone);
  }

  /**
   * Prompt user to install PWA
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted install');
        this.showInstallPrompt$.next(false);
        return true;
      } else {
        console.log('User dismissed install');
        this.dismissInstallPrompt();
        return false;
      }
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  }

  /**
   * Dismiss install prompt
   */
  dismissInstallPrompt(): void {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    this.showInstallPrompt$.next(false);
  }

  /**
   * Get install prompt status
   */
  getInstallPromptStatus(): Observable<boolean> {
    return this.showInstallPrompt$.asObservable();
  }

  /**
   * Check if app is installed
   */
  getInstallStatus(): Observable<boolean> {
    return this.isInstalled$.asObservable();
  }

  /**
   * Check if running in standalone mode
   */
  getStandaloneStatus(): Observable<boolean> {
    return this.isStandalone$.asObservable();
  }

  /**
   * Check if install is available
   */
  isInstallAvailable(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Get display mode
   */
  getDisplayMode(): 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' {
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    return 'browser';
  }

  /**
   * Check if PWA features are supported
   */
  isPWASupported(): boolean {
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  }
}
