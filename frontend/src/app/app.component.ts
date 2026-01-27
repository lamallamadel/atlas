import { Component, OnInit, OnDestroy } from '@angular/core';
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
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';
  isNavigating = false;
  showLoadingOverlay = false;
  private loadingTimeout: any;
  private subscriptions = new Subscription();
  public isNativePlatform = Capacitor.isNativePlatform();

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private swService: ServiceWorkerRegistrationService,
    private queueService: OfflineQueueService,
    private liveAnnouncer: LiveAnnouncerService,
    private prefetchService: PrefetchService,
    private navigationService: NavigationService,
    private nativeAppInit: NativeAppInitService,
    private platformService: NativePlatformService
  ) {}

  async ngOnInit(): Promise<void> {
    this.swService.register();

    // Initialize native app features if running on native platform
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
        this.isNavigating = true;
        this.loadingTimeout = setTimeout(() => {
          this.showLoadingOverlay = true;
        }, 300);
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
        this.isNavigating = false;
        clearTimeout(this.loadingTimeout);
        this.showLoadingOverlay = false;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    
    // Clean up native platform listeners
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
