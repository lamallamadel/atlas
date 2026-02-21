import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavigationHistoryEntry {
  url: string;
  scrollPosition: [number, number];
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private navigationHistory: NavigationHistoryEntry[] = [];
  private currentIndex = -1;
  private scrollPositions = new Map<string, [number, number]>();
  private isBackNavigation = false;
  private isForwardNavigation = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.updateNavigationHistory(event.urlAfterRedirects);
    });

    window.addEventListener('popstate', () => {
      this.isBackNavigation = true;
      setTimeout(() => {
        this.isBackNavigation = false;
      }, 500);
    });
  }

  private updateNavigationHistory(url: string): void {
    if (this.currentIndex >= 0 && this.navigationHistory[this.currentIndex]) {
      const scrollPos = this.getScrollPosition();
      this.scrollPositions.set(this.navigationHistory[this.currentIndex].url, scrollPos);
    }

    if (this.currentIndex < this.navigationHistory.length - 1) {
      this.navigationHistory = this.navigationHistory.slice(0, this.currentIndex + 1);
    }

    this.navigationHistory.push({
      url,
      scrollPosition: [0, 0]
    });
    this.currentIndex = this.navigationHistory.length - 1;
  }

  getRouteAnimation(): string {
    if (this.isBackNavigation) {
      return 'slideRight';
    } else if (this.isForwardNavigation) {
      return 'slideLeft';
    }
    return 'fadeIn';
  }

  saveScrollPosition(url?: string): void {
    const currentUrl = url || this.router.url;
    const scrollPos = this.getScrollPosition();
    this.scrollPositions.set(currentUrl, scrollPos);
  }

  restoreScrollPosition(url?: string): void {
    const currentUrl = url || this.router.url;
    const scrollPos = this.scrollPositions.get(currentUrl);
    
    if (scrollPos) {
      setTimeout(() => {
        window.scrollTo(scrollPos[0], scrollPos[1]);
      }, 0);
    } else {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    }
  }

  private getScrollPosition(): [number, number] {
    return [window.pageXOffset || document.documentElement.scrollLeft || 0,
            window.pageYOffset || document.documentElement.scrollTop || 0];
  }

  navigateBack(): void {
    if (this.currentIndex > 0) {
      this.isBackNavigation = true;
      this.currentIndex--;
      const entry = this.navigationHistory[this.currentIndex];
      this.router.navigateByUrl(entry.url).then(() => {
        this.restoreScrollPosition(entry.url);
        setTimeout(() => {
          this.isBackNavigation = false;
        }, 500);
      });
    }
  }

  navigateForward(): void {
    if (this.currentIndex < this.navigationHistory.length - 1) {
      this.isForwardNavigation = true;
      this.currentIndex++;
      const entry = this.navigationHistory[this.currentIndex];
      this.router.navigateByUrl(entry.url).then(() => {
        this.restoreScrollPosition(entry.url);
        setTimeout(() => {
          this.isForwardNavigation = false;
        }, 500);
      });
    }
  }

  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  canGoForward(): boolean {
    return this.currentIndex < this.navigationHistory.length - 1;
  }
}
