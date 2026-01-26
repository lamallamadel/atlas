# Global Search Bar - Usage Examples

## Basic Usage

### 1. Simple Integration in Header

```html
<!-- app-layout.component.html -->
<header class="app-header">
  <div class="header-left">
    <img src="assets/logo.svg" alt="Logo" />
  </div>
  
  <div class="header-center">
    <app-global-search-bar></app-global-search-bar>
  </div>
  
  <div class="header-right">
    <button mat-icon-button>
      <mat-icon>notifications</mat-icon>
    </button>
  </div>
</header>
```

```scss
// app-layout.component.scss
.app-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;

  .header-center {
    flex: 1;
    max-width: 600px;
  }
}
```

## Advanced Integration

### 2. With Custom Styling

```scss
// Custom theme for search bar
app-global-search-bar {
  --search-primary-color: #2196F3;
  --search-hover-color: #E3F2FD;
  --search-border-radius: 12px;
  
  ::ng-deep {
    .search-input {
      background: #f8f9fa;
      border-color: transparent;
      
      &:focus {
        background: white;
      }
    }
  }
}
```

### 3. Programmatic Search Triggering

```typescript
// parent.component.ts
import { Component, ViewChild } from '@angular/core';
import { GlobalSearchBarComponent } from './components/global-search-bar.component';

@Component({
  selector: 'app-parent',
  template: `
    <button (click)="triggerSearch()">Search for Paris</button>
    <app-global-search-bar #searchBar></app-global-search-bar>
  `
})
export class ParentComponent {
  @ViewChild('searchBar') searchBar!: GlobalSearchBarComponent;

  triggerSearch() {
    this.searchBar.searchQuery = 'Paris';
    this.searchBar.onSearchInput({ target: { value: 'Paris' } });
    this.searchBar.searchInput.nativeElement.focus();
  }
}
```

### 4. Listening to Search Events

```typescript
// Extended component with custom events
import { Component, Output, EventEmitter } from '@angular/core';
import { GlobalSearchBarComponent } from './global-search-bar.component';

@Component({
  selector: 'app-custom-search-bar',
  templateUrl: './global-search-bar.component.html',
  styleUrls: ['./global-search-bar.component.scss']
})
export class CustomSearchBarComponent extends GlobalSearchBarComponent {
  @Output() searchStarted = new EventEmitter<string>();
  @Output() searchCompleted = new EventEmitter<any[]>();
  @Output() resultSelected = new EventEmitter<any>();

  override onSearchInput(event: any) {
    super.onSearchInput(event);
    this.searchStarted.emit(event.target.value);
  }

  override navigateToResult(result: any) {
    this.resultSelected.emit(result);
    super.navigateToResult(result);
  }
}
```

## Service Integration Examples

### 5. Using Search History Service

```typescript
import { Component, OnInit } from '@angular/core';
import { SearchHistoryService } from '../services/search-history.service';

@Component({
  selector: 'app-search-analytics',
  template: `
    <h3>Popular Searches</h3>
    <ul>
      <li *ngFor="let item of popularSearches">
        {{ item.query }} ({{ item.count }} searches)
      </li>
    </ul>
  `
})
export class SearchAnalyticsComponent implements OnInit {
  popularSearches: any[] = [];

  constructor(private searchHistory: SearchHistoryService) {}

  ngOnInit() {
    const history = this.searchHistory.getHistory();
    
    // Aggregate search counts
    const countMap = new Map<string, number>();
    history.forEach(item => {
      countMap.set(item.query, (countMap.get(item.query) || 0) + 1);
    });
    
    // Convert to array and sort
    this.popularSearches = Array.from(countMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}
```

### 6. Using Fuzzy Search Service

```typescript
import { Component, OnInit } from '@angular/core';
import { FuzzySearchService } from '../services/fuzzy-search.service';

interface Product {
  id: number;
  name: string;
  category: string;
}

@Component({
  selector: 'app-product-search',
  template: `
    <input [(ngModel)]="query" (input)="onSearch()" placeholder="Search products..." />
    <div *ngFor="let product of filteredProducts">
      {{ product.name }} - {{ product.category }}
    </div>
  `
})
export class ProductSearchComponent implements OnInit {
  query = '';
  products: Product[] = [
    { id: 1, name: 'iPhone 14', category: 'Electronics' },
    { id: 2, name: 'iPad Pro', category: 'Electronics' },
    { id: 3, name: 'MacBook Air', category: 'Computers' }
  ];
  filteredProducts: Product[] = [];

  constructor(private fuzzySearch: FuzzySearchService) {}

  ngOnInit() {
    this.filteredProducts = this.products;
  }

  onSearch() {
    this.filteredProducts = this.fuzzySearch.search(
      this.products,
      this.query,
      (product) => [product.name, product.category]
    );
  }
}
```

## Customization Examples

### 7. Custom Result Renderer

```typescript
// custom-search-result.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-custom-search-result',
  template: `
    <div class="custom-result" (click)="onClick()">
      <img [src]="result.imageUrl" alt="" />
      <div class="result-content">
        <h4 [innerHTML]="result.highlightedTitle"></h4>
        <p [innerHTML]="result.highlightedDescription"></p>
        <div class="result-meta">
          <span class="badge">{{ result.type }}</span>
          <span class="date">{{ result.createdAt | date }}</span>
        </div>
      </div>
      <button mat-icon-button (click)="onStar($event)">
        <mat-icon>{{ result.starred ? 'star' : 'star_border' }}</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .custom-result {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      
      &:hover {
        background: #f5f5f5;
      }
      
      img {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: cover;
      }
      
      .result-content {
        flex: 1;
        
        h4 {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 600;
        }
        
        p {
          margin: 0 0 8px;
          font-size: 12px;
          color: #666;
        }
      }
      
      .result-meta {
        display: flex;
        gap: 8px;
        font-size: 11px;
        
        .badge {
          padding: 2px 8px;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 12px;
        }
        
        .date {
          color: #999;
        }
      }
    }
  `]
})
export class CustomSearchResultComponent {
  @Input() result: any;
  @Output() selected = new EventEmitter<any>();
  @Output() starred = new EventEmitter<any>();

  onClick() {
    this.selected.emit(this.result);
  }

  onStar(event: Event) {
    event.stopPropagation();
    this.starred.emit(this.result);
  }
}
```

### 8. Search with Filters

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-filtered-search',
  template: `
    <div class="search-with-filters">
      <app-global-search-bar></app-global-search-bar>
      
      <div class="filters" [formGroup]="filterForm">
        <mat-form-field>
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="">Tous</mat-option>
            <mat-option value="annonce">Annonces</mat-option>
            <mat-option value="dossier">Dossiers</mat-option>
            <mat-option value="contact">Contacts</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field>
          <mat-label>Date</mat-label>
          <mat-date-range-input [rangePicker]="picker">
            <input matStartDate formControlName="startDate" placeholder="Début">
            <input matEndDate formControlName="endDate" placeholder="Fin">
          </mat-date-range-input>
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-date-range-picker #picker></mat-date-range-picker>
        </mat-form-field>
        
        <button mat-raised-button color="primary" (click)="applyFilters()">
          Appliquer
        </button>
        <button mat-button (click)="resetFilters()">
          Réinitialiser
        </button>
      </div>
    </div>
  `,
  styles: [`
    .search-with-filters {
      .filters {
        display: flex;
        gap: 16px;
        margin-top: 16px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
      }
    }
  `]
})
export class FilteredSearchComponent {
  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      type: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    console.log('Applying filters:', filters);
    // Send filters to search service
  }

  resetFilters() {
    this.filterForm.reset();
  }
}
```

## Testing Examples

### 9. Component Testing

```typescript
// global-search-bar.component.spec.ts - Additional test cases

it('should handle rapid typing (debounce test)', fakeAsync(() => {
  const spy = spyOn(component['searchSubject'], 'next');
  
  component.searchQuery = 't';
  component.onSearchInput({ target: { value: 't' } });
  
  tick(100);
  component.searchQuery = 'te';
  component.onSearchInput({ target: { value: 'te' } });
  
  tick(100);
  component.searchQuery = 'tes';
  component.onSearchInput({ target: { value: 'tes' } });
  
  tick(300);
  
  // Only last input should trigger search
  expect(spy).toHaveBeenCalledTimes(3);
}));

it('should prioritize exact matches in fuzzy search', () => {
  const items = [
    { title: 'Test Property', description: '' },
    { title: 'Testing Area', description: '' },
    { title: 'Best Property', description: '' }
  ];
  
  const results = component['fuzzyFilter'](items, 'test');
  
  expect(results[0].title).toBe('Test Property');
});
```

### 10. E2E Testing

```typescript
// search.e2e-spec.ts
import { browser, by, element, ExpectedConditions as EC } from 'protractor';

describe('Global Search Bar E2E', () => {
  beforeEach(async () => {
    await browser.get('/');
    await browser.wait(EC.presenceOf(element(by.css('app-global-search-bar'))), 5000);
  });

  it('should focus search input with "/" key', async () => {
    await browser.actions().sendKeys('/').perform();
    const input = element(by.css('#global-search-input'));
    expect(await input.equals(await browser.driver.switchTo().activeElement())).toBe(true);
  });

  it('should display results after typing', async () => {
    const input = element(by.css('#global-search-input'));
    await input.sendKeys('paris');
    await browser.wait(EC.presenceOf(element(by.css('.search-dropdown'))), 2000);
    
    const results = element.all(by.css('.result-item'));
    expect(await results.count()).toBeGreaterThan(0);
  });

  it('should navigate with arrow keys', async () => {
    const input = element(by.css('#global-search-input'));
    await input.sendKeys('test');
    await browser.wait(EC.presenceOf(element(by.css('.search-dropdown'))), 2000);
    
    await browser.actions().sendKeys(protractor.Key.ARROW_DOWN).perform();
    
    const selected = element(by.css('.result-item.selected'));
    expect(await selected.isPresent()).toBe(true);
  });

  it('should open result on Enter key', async () => {
    const input = element(by.css('#global-search-input'));
    await input.sendKeys('test');
    await browser.wait(EC.presenceOf(element(by.css('.search-dropdown'))), 2000);
    
    await browser.actions().sendKeys(protractor.Key.ARROW_DOWN).perform();
    await browser.actions().sendKeys(protractor.Key.ENTER).perform();
    
    await browser.wait(EC.urlContains('/annonces/'), 2000);
    expect(await browser.getCurrentUrl()).toContain('/annonces/');
  });
});
```

## Performance Optimization Examples

### 11. Virtualized Results (Large Datasets)

```typescript
// For handling 1000+ results efficiently
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-virtual-search-results',
  template: `
    <cdk-virtual-scroll-viewport itemSize="60" class="results-viewport">
      <div *cdkVirtualFor="let result of flatResults" 
           class="result-item"
           (click)="navigateToResult(result)">
        <div class="result-title">{{ result.title }}</div>
        <div class="result-description">{{ result.description }}</div>
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .results-viewport {
      height: 400px;
      overflow-y: auto;
    }
  `]
})
export class VirtualSearchResultsComponent {
  // ... component logic
}
```

### 12. Memoized Preview Generation

```typescript
import { memoize } from 'lodash-es';

export class OptimizedGlobalSearchBarComponent extends GlobalSearchBarComponent {
  
  // Memoize expensive preview generation
  private generatePreviewMemoized = memoize(
    this.generatePreview,
    (result) => `${result.type}-${result.id}` // cache key
  );

  override generatePreview(result: SearchResult): any {
    return this.generatePreviewMemoized(result);
  }
}
```

## Integration with State Management

### 13. NgRx Integration

```typescript
// search.actions.ts
import { createAction, props } from '@ngrx/store';

export const searchQueryChanged = createAction(
  '[Search] Query Changed',
  props<{ query: string }>()
);

export const searchSuccess = createAction(
  '[Search] Success',
  props<{ results: any[], totalHits: number }>()
);

// search.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { SearchApiService } from '../services/search-api.service';
import { debounceTime, switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class SearchEffects {
  search$ = createEffect(() =>
    this.actions$.pipe(
      ofType(searchQueryChanged),
      debounceTime(300),
      switchMap(({ query }) =>
        this.searchService.autocomplete(query).pipe(
          map(response => searchSuccess({
            results: response.results,
            totalHits: response.totalHits
          })),
          catchError(() => of({ type: '[Search] Failure' }))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private searchService: SearchApiService
  ) {}
}
```

These examples demonstrate the flexibility and extensibility of the Global Search Bar component across different use cases and architectures.
