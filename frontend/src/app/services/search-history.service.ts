import { Injectable } from '@angular/core';

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchHistoryService {
  private readonly STORAGE_KEY = 'globalSearchHistory';
  private readonly MAX_ITEMS = 10;

  getHistory(): SearchHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load search history', e);
    }
    return [];
  }

  addToHistory(query: string, resultCount?: number): void {
    if (!query || query.trim().length < 2) {
      return;
    }

    let history = this.getHistory();
    
    // Remove existing entry with same query
    history = history.filter(item => item.query !== query);
    
    // Add new entry at the beginning
    history.unshift({
      query: query.trim(),
      timestamp: Date.now(),
      resultCount
    });

    // Keep only MAX_ITEMS
    if (history.length > this.MAX_ITEMS) {
      history = history.slice(0, this.MAX_ITEMS);
    }

    this.saveHistory(history);
  }

  removeFromHistory(query: string): void {
    let history = this.getHistory();
    history = history.filter(item => item.query !== query);
    this.saveHistory(history);
  }

  clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear search history', e);
    }
  }

  private saveHistory(history: SearchHistoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save search history', e);
    }
  }
}
