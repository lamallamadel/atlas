import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DossierApiService } from './dossier-api.service';
import { AnnonceApiService } from './annonce-api.service';

interface PrefetchConfig {
  route: string;
  probability: number;
  fetcher: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class PrefetchService {
  private prefetchQueue = new Subject<string>();
  private prefetchedRoutes = new Set<string>();
  private navigationHistory: string[] = [];
  private maxHistorySize = 10;

  private routeProbabilities = new Map<string, number>();

  constructor(
    private router: Router,
    private dossierApiService: DossierApiService,
    private annonceApiService: AnnonceApiService
  ) {
    this.initializeNavigationTracking();
    this.initializePrefetchQueue();
  }

  private initializeNavigationTracking(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.trackNavigation(event.urlAfterRedirects);
        this.predictAndPrefetch(event.urlAfterRedirects);
      });
  }

  private initializePrefetchQueue(): void {
    this.prefetchQueue
      .pipe(debounceTime(100))
      .subscribe(route => {
        if (!this.prefetchedRoutes.has(route)) {
          this.executePrefetch(route);
          this.prefetchedRoutes.add(route);
        }
      });
  }

  private trackNavigation(url: string): void {
    this.navigationHistory.push(url);
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory.shift();
    }
    this.updateRouteProbabilities();
  }

  private updateRouteProbabilities(): void {
    if (this.navigationHistory.length < 2) return;

    const lastRoute = this.navigationHistory[this.navigationHistory.length - 2];
    const currentRoute = this.navigationHistory[this.navigationHistory.length - 1];
    const key = `${lastRoute}→${currentRoute}`;

    const currentProb = this.routeProbabilities.get(key) || 0;
    this.routeProbabilities.set(key, currentProb + 1);
  }

  private predictAndPrefetch(currentRoute: string): void {
    const predictions = this.getPredictions(currentRoute);
    predictions.forEach(prediction => {
      if (prediction.probability > 0.3) {
        this.prefetchQueue.next(prediction.route);
      }
    });
  }

  private getPredictions(currentRoute: string): PrefetchConfig[] {
    const predictions: PrefetchConfig[] = [];

    // Common patterns
    if (currentRoute.includes('/dossiers') && !currentRoute.includes('/dossiers/')) {
      predictions.push({
        route: '/dossiers/details',
        probability: 0.7,
        fetcher: () => this.prefetchDossiersList()
      });
    }

    if (currentRoute.match(/\/dossiers\/\d+$/)) {
      predictions.push({
        route: '/dossiers/list',
        probability: 0.5,
        fetcher: () => this.prefetchDossiersList()
      });
    }

    if (currentRoute.includes('/annonces') && !currentRoute.includes('/annonces/')) {
      predictions.push({
        route: '/annonces/details',
        probability: 0.6,
        fetcher: () => this.prefetchAnnoncesList()
      });
    }

    if (currentRoute === '/dashboard') {
      predictions.push(
        {
          route: '/dossiers',
          probability: 0.8,
          fetcher: () => this.prefetchDossiersList()
        },
        {
          route: '/annonces',
          probability: 0.6,
          fetcher: () => this.prefetchAnnoncesList()
        }
      );
    }

    // History-based predictions
    this.routeProbabilities.forEach((count, key) => {
      const [from, to] = key.split('→');
      if (from === currentRoute) {
        const totalFromRoute = Array.from(this.routeProbabilities.entries())
          .filter(([k]) => k.startsWith(from + '→'))
          .reduce((sum, [, c]) => sum + c, 0);
        
        const probability = count / totalFromRoute;
        if (probability > 0.3) {
          predictions.push({
            route: to,
            probability,
            fetcher: () => this.prefetchByRoute(to)
          });
        }
      }
    });

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  private executePrefetch(route: string): void {
    if (route.includes('/dossiers')) {
      this.prefetchDossiersList();
    } else if (route.includes('/annonces')) {
      this.prefetchAnnoncesList();
    }
  }

  private prefetchByRoute(route: string): void {
    if (route.includes('/dossiers')) {
      this.prefetchDossiersList();
    } else if (route.includes('/annonces')) {
      this.prefetchAnnoncesList();
    }
  }

  private prefetchDossiersList(): void {
    // Prefetch first page with small size
    this.dossierApiService.list({ page: 0, size: 10 }).subscribe({
      next: () => console.log('[Prefetch] Dossiers list prefetched'),
      error: () => console.warn('[Prefetch] Failed to prefetch dossiers')
    });
  }

  private prefetchAnnoncesList(): void {
    // Prefetch first page with small size
    this.annonceApiService.list({ page: 0, size: 10 }).subscribe({
      next: () => console.log('[Prefetch] Annonces list prefetched'),
      error: () => console.warn('[Prefetch] Failed to prefetch annonces')
    });
  }

  public manualPrefetch(route: string): void {
    this.prefetchQueue.next(route);
  }

  public clearPrefetchCache(): void {
    this.prefetchedRoutes.clear();
  }
}
