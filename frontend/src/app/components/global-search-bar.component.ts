import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SearchApiService, SearchResult } from '../services/search-api.service';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of, Subscription } from 'rxjs';

interface GroupedResults {
  annonces: EnhancedSearchResult[];
  dossiers: EnhancedSearchResult[];
  contacts: EnhancedSearchResult[];
}

interface EnhancedSearchResult extends SearchResult {
  highlightedTitle?: string;
  highlightedDescription?: string;
  preview?: any;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

@Component({
  selector: 'app-global-search-bar',
  templateUrl: './global-search-bar.component.html',
  styleUrls: ['./global-search-bar.component.scss']
})
export class GlobalSearchBarComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;

  searchQuery = '';
  groupedResults: GroupedResults = {
    annonces: [],
    dossiers: [],
    contacts: []
  };
  recentSearches: RecentSearch[] = [];
  totalHits = 0;
  elasticsearchAvailable = false;
  showDropdown = false;
  isLoading = false;
  error = '';
  hoveredResult: EnhancedSearchResult | null = null;
  selectedIndex = -1;
  flatResults: EnhancedSearchResult[] = [];

  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  private readonly RECENT_SEARCHES_KEY = 'globalSearchRecent';
  private readonly MAX_RECENT_SEARCHES = 5;

  constructor(
    private searchService: SearchApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRecentSearches();
    
    const searchSub = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query || query.trim().length < 2) {
            return of({ results: [], totalHits: 0, elasticsearchAvailable: false });
          }
          this.isLoading = true;
          this.error = '';
          return this.searchService.autocomplete(query).pipe(
            catchError(() => {
              this.error = 'Échec de la recherche. Veuillez réessayer.';
              return of({ results: [], totalHits: 0, elasticsearchAvailable: false });
            })
          );
        })
      )
      .subscribe(response => {
        const enhancedResults = this.enhanceResults(response.results, this.searchQuery);
        this.groupResults(enhancedResults);
        this.totalHits = response.totalHits;
        this.elasticsearchAvailable = response.elasticsearchAvailable;
        this.isLoading = false;
        this.selectedIndex = -1;
      });

    this.subscriptions.add(searchSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  onFocus() {
    this.showDropdown = true;
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
      this.hoveredResult = null;
    }, 200);
  }

  clearSearch() {
    this.searchQuery = '';
    this.groupedResults = { annonces: [], dossiers: [], contacts: [] };
    this.flatResults = [];
    this.totalHits = 0;
    this.showDropdown = false;
    this.selectedIndex = -1;
    this.hoveredResult = null;
  }

  navigateToResult(result: EnhancedSearchResult) {
    this.saveRecentSearch(this.searchQuery);
    
    if (result.type === 'annonce') {
      this.router.navigate(['/annonces', result.id]);
    } else if (result.type === 'dossier') {
      this.router.navigate(['/dossiers', result.id]);
    } else if (result.type === 'contact') {
      this.router.navigate(['/parties-prenantes', result.id]);
    }
    this.clearSearch();
  }

  viewAllResults() {
    this.saveRecentSearch(this.searchQuery);
    this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    this.clearSearch();
  }

  selectRecentSearch(search: RecentSearch) {
    this.searchQuery = search.query;
    this.searchSubject.next(search.query);
    this.searchInput.nativeElement.focus();
  }

  removeRecentSearch(search: RecentSearch, event: Event) {
    event.stopPropagation();
    this.recentSearches = this.recentSearches.filter(s => s.timestamp !== search.timestamp);
    this.saveRecentSearchesToStorage();
  }

  onResultHover(result: EnhancedSearchResult) {
    this.hoveredResult = result;
  }

  onResultLeave() {
    this.hoveredResult = null;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      event.preventDefault();
      this.searchInput.nativeElement.focus();
      return;
    }

    if (!this.showDropdown || this.flatResults.length === 0) {
      return;
    }

    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          this.navigatePrevious();
        } else {
          this.navigateNext();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.navigateNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigatePrevious();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.flatResults.length) {
          this.navigateToResult(this.flatResults[this.selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.clearSearch();
        this.searchInput.nativeElement.blur();
        break;
    }
  }

  private navigateNext() {
    this.selectedIndex = (this.selectedIndex + 1) % this.flatResults.length;
    this.scrollToSelected();
  }

  private navigatePrevious() {
    this.selectedIndex = this.selectedIndex <= 0 ? this.flatResults.length - 1 : this.selectedIndex - 1;
    this.scrollToSelected();
  }

  private scrollToSelected() {
    setTimeout(() => {
      const element = document.getElementById(`search-result-${this.selectedIndex}`);
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  private enhanceResults(results: SearchResult[], query: string): EnhancedSearchResult[] {
    const fuzzyResults = this.fuzzyFilter(results, query);
    return fuzzyResults.map(result => ({
      ...result,
      highlightedTitle: this.highlightText(result.title, query),
      highlightedDescription: result.description ? this.highlightText(result.description, query) : undefined,
      preview: this.generatePreview(result)
    }));
  }

  private fuzzyFilter(results: SearchResult[], query: string): SearchResult[] {
    if (!query) return results;
    
    const lowerQuery = query.toLowerCase();
    
    return results
      .map(result => {
        const titleScore = this.fuzzyScore(result.title.toLowerCase(), lowerQuery);
        const descScore = result.description ? this.fuzzyScore(result.description.toLowerCase(), lowerQuery) : 0;
        const maxScore = Math.max(titleScore, descScore);
        
        return { result, score: maxScore };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.result);
  }

  private fuzzyScore(text: string, query: string): number {
    let score = 0;
    let queryIndex = 0;
    let textIndex = 0;
    let consecutiveMatches = 0;

    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        score += 1 + consecutiveMatches;
        consecutiveMatches++;
        queryIndex++;
      } else {
        consecutiveMatches = 0;
      }
      textIndex++;
    }

    if (queryIndex === query.length) {
      score += 10;
    }

    return score;
  }

  private highlightText(text: string, query: string): string {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private generatePreview(result: SearchResult): any {
    const preview: any = {
      id: result.id,
      type: result.type
    };

    if (result.type === 'annonce') {
      preview.details = [
        { label: 'Type', value: result.description || 'N/A' },
        { label: 'Créé', value: this.formatDate(result.createdAt) },
        { label: 'Modifié', value: this.formatDate(result.updatedAt) }
      ];
    } else if (result.type === 'dossier') {
      preview.details = [
        { label: 'Description', value: result.description || 'N/A' },
        { label: 'Créé', value: this.formatDate(result.createdAt) },
        { label: 'Score', value: result.relevanceScore?.toFixed(2) || 'N/A' }
      ];
    } else if (result.type === 'contact') {
      preview.details = [
        { label: 'Info', value: result.description || 'N/A' },
        { label: 'Créé', value: this.formatDate(result.createdAt) }
      ];
    }

    return preview;
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  private groupResults(results: EnhancedSearchResult[]) {
    this.groupedResults = {
      annonces: results.filter(r => r.type === 'annonce'),
      dossiers: results.filter(r => r.type === 'dossier'),
      contacts: results.filter(r => r.type === 'contact')
    };

    this.flatResults = [
      ...this.groupedResults.annonces,
      ...this.groupedResults.dossiers,
      ...this.groupedResults.contacts
    ];
  }

  private loadRecentSearches() {
    try {
      const stored = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (stored) {
        this.recentSearches = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
      this.recentSearches = [];
    }
  }

  private saveRecentSearch(query: string) {
    if (!query || query.trim().length < 2) return;

    this.recentSearches = this.recentSearches.filter(s => s.query !== query);
    
    this.recentSearches.unshift({
      query: query.trim(),
      timestamp: Date.now()
    });

    if (this.recentSearches.length > this.MAX_RECENT_SEARCHES) {
      this.recentSearches = this.recentSearches.slice(0, this.MAX_RECENT_SEARCHES);
    }

    this.saveRecentSearchesToStorage();
  }

  private saveRecentSearchesToStorage() {
    try {
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (e) {
      console.error('Failed to save recent searches', e);
    }
  }

  get hasResults(): boolean {
    return this.flatResults.length > 0;
  }

  get showRecentSearches(): boolean {
    return !this.searchQuery && this.recentSearches.length > 0;
  }

  isSelected(index: number): boolean {
    return this.selectedIndex === index;
  }

  getResultIndex(group: string, groupIndex: number): number {
    let index = groupIndex;
    if (group === 'dossiers') {
      index += this.groupedResults.annonces.length;
    } else if (group === 'contacts') {
      index += this.groupedResults.annonces.length + this.groupedResults.dossiers.length;
    }
    return index;
  }

  truncate(text: string, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
