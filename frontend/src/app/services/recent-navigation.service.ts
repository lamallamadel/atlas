import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface RecentItem {
  id: string;
  type: 'dossier' | 'annonce';
  title: string;
  subtitle?: string;
  route: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecentNavigationService {
  private readonly STORAGE_KEY = 'recent_navigation';
  private readonly MAX_ITEMS = 10;
  
  private recentItemsSubject: BehaviorSubject<RecentItem[]>;
  public recentItems$: Observable<RecentItem[]>;

  constructor(private router: Router) {
    const stored = this.loadFromStorage();
    this.recentItemsSubject = new BehaviorSubject<RecentItem[]>(stored);
    this.recentItems$ = this.recentItemsSubject.asObservable();
    
    this.initializeRouterTracking();
  }

  private initializeRouterTracking(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.trackNavigation(event.url);
    });
  }

  private trackNavigation(url: string): void {
    // Parse dossier/annonce routes
    const dossierMatch = url.match(/\/dossiers\/(\d+)/);
    const annonceMatch = url.match(/\/annonces\/(\d+)/);
    
    if (dossierMatch) {
      const id = dossierMatch[1];
      // Don't add immediately - wait for title to be set via addRecentItem
      return;
    } else if (annonceMatch) {
      const id = annonceMatch[1];
      // Don't add immediately - wait for title to be set via addRecentItem
      return;
    }
  }

  addRecentItem(item: Omit<RecentItem, 'timestamp'>): void {
    const items = this.recentItemsSubject.value;
    const timestamp = Date.now();
    
    // Remove existing entry with same id
    const filtered = items.filter(i => i.id !== item.id);
    
    // Add new item at the beginning
    const newItems = [{ ...item, timestamp }, ...filtered].slice(0, this.MAX_ITEMS);
    
    this.recentItemsSubject.next(newItems);
    this.saveToStorage(newItems);
  }

  getRecentItems(): RecentItem[] {
    return this.recentItemsSubject.value;
  }

  clearRecentItems(): void {
    this.recentItemsSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private loadFromStorage(): RecentItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load recent navigation', e);
    }
    return [];
  }

  private saveToStorage(items: RecentItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save recent navigation', e);
    }
  }
}
