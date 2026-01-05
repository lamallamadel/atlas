import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { SearchApiService, SearchResult } from '../services/search-api.service';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
  selector: 'app-global-search-bar',
  template: `
    <div class="search-container">
      <div class="search-input-wrapper">
        <input
          #searchInput
          type="text"
          class="search-input"
          placeholder="Search annonces and dossiers..."
          [(ngModel)]="searchQuery"
          (input)="onSearchInput($event)"
          (focus)="showDropdown = true"
          (blur)="onBlur()"
        />
        <span class="search-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </span>
        <button *ngIf="searchQuery" class="clear-button" (click)="clearSearch()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="search-dropdown" *ngIf="showDropdown && (searchResults.length > 0 || isLoading || error)">
        <div class="loading" *ngIf="isLoading">
          <span>Searching...</span>
        </div>
        
        <div class="error" *ngIf="error && !isLoading">
          <span>{{ error }}</span>
        </div>
        
        <div class="results" *ngIf="!isLoading && !error && searchResults.length > 0">
          <div
            *ngFor="let result of searchResults"
            class="result-item"
            (mousedown)="navigateToResult(result)"
          >
            <div class="result-type-badge" [class.annonce]="result.type === 'annonce'" [class.dossier]="result.type === 'dossier'">
              {{ result.type }}
            </div>
            <div class="result-content">
              <div class="result-title">{{ result.title }}</div>
              <div class="result-description" *ngIf="result.description">
                {{ truncate(result.description, 100) }}
              </div>
            </div>
            <div class="result-score" *ngIf="elasticsearchAvailable">
              <span class="score-badge">{{ result.relevanceScore | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
        
        <div class="no-results" *ngIf="!isLoading && !error && searchResults.length === 0 && searchQuery">
          <span>No results found</span>
        </div>
        
        <div class="search-footer" *ngIf="!isLoading && searchResults.length > 0">
          <button class="view-all-button" (mousedown)="viewAllResults()">
            View all results ({{ totalHits }})
          </button>
          <span class="es-status" *ngIf="!elasticsearchAvailable" title="Using PostgreSQL search">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      position: relative;
      width: 100%;
      max-width: 500px;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input {
      width: 100%;
      padding: 8px 36px 8px 36px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #4CAF50;
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
    }

    .search-icon {
      position: absolute;
      left: 10px;
      color: #666;
      pointer-events: none;
    }

    .clear-button {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .clear-button:hover {
      background-color: #f0f0f0;
    }

    .search-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
    }

    .loading, .error, .no-results {
      padding: 16px;
      text-align: center;
      color: #666;
    }

    .error {
      color: #f44336;
    }

    .results {
      padding: 8px 0;
    }

    .result-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s;
      gap: 12px;
    }

    .result-item:hover {
      background-color: #f5f5f5;
    }

    .result-type-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .result-type-badge.annonce {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .result-type-badge.dossier {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .result-content {
      flex: 1;
      min-width: 0;
    }

    .result-title {
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 4px;
      color: #333;
    }

    .result-description {
      font-size: 12px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .result-score {
      flex-shrink: 0;
    }

    .score-badge {
      background-color: #fff3cd;
      color: #856404;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .search-footer {
      border-top: 1px solid #eee;
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .view-all-button {
      background: none;
      border: none;
      color: #4CAF50;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 0;
    }

    .view-all-button:hover {
      text-decoration: underline;
    }

    .es-status {
      color: #ff9800;
      display: flex;
      align-items: center;
    }
  `]
})
export class GlobalSearchBarComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  searchQuery = '';
  searchResults: SearchResult[] = [];
  totalHits = 0;
  elasticsearchAvailable = false;
  showDropdown = false;
  isLoading = false;
  error = '';

  private searchSubject = new Subject<string>();

  constructor(
    private searchService: SearchApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.searchSubject
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
            catchError(err => {
              this.error = 'Search failed. Please try again.';
              return of({ results: [], totalHits: 0, elasticsearchAvailable: false });
            })
          );
        })
      )
      .subscribe(response => {
        this.searchResults = response.results;
        this.totalHits = response.totalHits;
        this.elasticsearchAvailable = response.elasticsearchAvailable;
        this.isLoading = false;
      });
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.totalHits = 0;
    this.showDropdown = false;
  }

  navigateToResult(result: SearchResult) {
    if (result.type === 'annonce') {
      this.router.navigate(['/annonces', result.id]);
    } else if (result.type === 'dossier') {
      this.router.navigate(['/dossiers', result.id]);
    }
    this.clearSearch();
  }

  viewAllResults() {
    this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    this.clearSearch();
  }

  truncate(text: string, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
