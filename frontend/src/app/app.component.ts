import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeFadeSlideAnimation } from './animations/route-animations';
import { ThemeService } from './services/theme.service';
import { ServiceWorkerRegistrationService } from './services/service-worker-registration.service';
import { OfflineQueueService } from './services/offline-queue.service';
import { LiveAnnouncerService } from './services/live-announcer.service';
import { PrefetchService } from './services/prefetch.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [routeFadeSlideAnimation]
})
export class AppComponent implements OnInit {
  title = 'frontend';

  constructor(
    private themeService: ThemeService,
    private swService: ServiceWorkerRegistrationService,
    private queueService: OfflineQueueService,
    private liveAnnouncer: LiveAnnouncerService,
    private prefetchService: PrefetchService
  ) {}

  ngOnInit(): void {
    this.swService.register();

    window.addEventListener('sw-sync-queue', () => {
      this.queueService.syncQueue();
    });
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
