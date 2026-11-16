import { Component, OnInit, OnDestroy, inject, signal, isDevMode } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { routeFadeInAnimation } from './animations/route-animations';
import { ThemeService } from './services/theme.service';
import { ServiceWorkerRegistrationService } from './services/service-worker-registration.service';
import { OfflineQueueService } from './services/offline-queue.service';
import { LiveAnnouncerService } from './services/live-announcer.service';
import { PrefetchService } from './services/prefetch.service';
import { NavigationService } from './services/navigation.service';
import { NativeAppInitService } from './services/native-app-init.service';
import { NativePlatformService } from './services/native-platform.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import { OfflineIndicatorComponent } from './components/offline-indicator.component';
import { DsProgressBarComponent, DsToastContainerComponent } from './design-system';
import { TourLauncherComponent } from './components/tour-launcher.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    animations: [
        routeFadeInAnimation,
        trigger('fadeInOut', [
            state('void', style({ opacity: 0 })),
            state('*', style({ opacity: 1 })),
            transition('void => *', animate('150ms ease-out')),
            transition('* => void', animate('150ms ease-in'))
        ])
    ],
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        OfflineIndicatorComponent,
        DsProgressBarComponent,
        DsToastContainerComponent,
        TourLauncherComponent,
    ]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Atlasia Pro';
  isNavigating = signal(false);
  navigationProgress = signal(0);
  private progressInterval: any;
  private subscriptions = new Subscription();
  public isNativePlatform = Capacitor.isNativePlatform();

  private router = inject(Router);
  private themeService = inject(ThemeService);
  private swService = inject(ServiceWorkerRegistrationService);
  private queueService = inject(OfflineQueueService);
  private liveAnnouncer = inject(LiveAnnouncerService);
  private prefetchService = inject(PrefetchService);
  private navigationService = inject(NavigationService);
  private nativeAppInit = inject(NativeAppInitService);
  private platformService = inject(NativePlatformService);

  async ngOnInit(): Promise<void> {
    if (isDevMode()) {
      // In dev mode, unregister any existing Service Worker to avoid stale intercepts.
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        });
      }
    } else {
      this.swService.register();
    }

    if (this.isNativePlatform) {
      await this.nativeAppInit.initialize();
    }

    window.addEventListener('sw-sync-queue', () => {
      this.queueService.syncQueue();
    });

    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationStart)
      ).subscribe(() => {
        this.startNavigationProgress();
      })
    );

    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => 
          event instanceof NavigationEnd || 
          event instanceof NavigationCancel || 
          event instanceof NavigationError
        )
      ).subscribe(() => {
        this.completeNavigationProgress();
      })
    );
  }

  private startNavigationProgress(): void {
    this.isNavigating.set(true);
    this.navigationProgress.set(0);
    this.clearProgressInterval();

    this.progressInterval = setInterval(() => {
      if (this.navigationProgress() < 90) {
        const increment = Math.random() * 5;
        this.navigationProgress.set(Math.min(this.navigationProgress() + increment, 90));
      }
    }, 150);
  }

  private completeNavigationProgress(): void {
    this.clearProgressInterval();
    this.navigationProgress.set(100);

    setTimeout(() => {
      this.isNavigating.set(false);
      this.navigationProgress.set(0);
    }, 300);
  }

  private clearProgressInterval(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearProgressInterval();
    
    if (this.isNativePlatform) {
      this.platformService.removeAllListeners();
    }
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }

  getRouteAnimation() {
    return this.navigationService.getRouteAnimation();
  }
}
