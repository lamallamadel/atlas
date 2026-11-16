import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchApiService, SearchResult } from '../../services/search-api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe, UpperCasePipe } from '@angular/common';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton.component';
import { 
  DsIconComponent, 
  DsButtonComponent, 
  DsInputComponent,
  DsSelectComponent,
  DsCardComponent,
  DsBadgeComponent,
  DsEmptyStateComponent,
  DsToastService,
  DsSelectOption,
  PageHeaderComponent
} from '../../design-system';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  imports: [
    CommonModule, 
    FormsModule, 
    LoadingSkeletonComponent,
    DsIconComponent, 
    DsButtonComponent,
    DsInputComponent,
    DsSelectComponent,
    DsCardComponent, 
    DsBadgeComponent, 
    DsEmptyStateComponent,    PageHeaderComponent,
    DecimalPipe,
    UpperCasePipe
  ]
})
// Force recompile Phase 3
export class SearchComponent implements OnInit {
  private searchApiService = inject(SearchApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(DsToastService);

  searchQuery = '';
  selectedType = '';
  searchResults: SearchResult[] = [];
  isLoading = false;
  totalHits = 0;
  page = 0;
  pageSize = 10;
  elasticsearchAvailable = false;
  error: string | null = null;

  readonly typeOptions: DsSelectOption[] = [
    { value: '', label: 'Tous les types' },
    { value: 'ANNONCE', label: 'Annonces' },
    { value: 'DOSSIER', label: 'Dossiers' }
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.selectedType = params['type'] || '';
      if (this.searchQuery) {
        this.search();
      }
    });
  }

  search(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.searchApiService.search(this.searchQuery, this.selectedType || undefined, undefined, this.page, this.pageSize).subscribe({
      next: (response) => {
        this.searchResults = response.results;
        this.totalHits = response.totalHits;
        this.elasticsearchAvailable = response.elasticsearchAvailable;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.error = 'Erreur lors de la recherche';
        this.toastService.error(this.error);
        this.isLoading = false;
      }
    });
  }

  onSearchQueryChange(): void {
    this.page = 0;
    this.updateUrl();
  }

  onTypeChange(): void {
    this.page = 0;
    this.updateUrl();
  }

  updateUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.searchQuery, type: this.selectedType || null },
      queryParamsHandling: 'merge'
    });
  }

  navigateToResult(result: SearchResult): void {
    if (result.type === 'ANNONCE') {
      this.router.navigate(['/annonces', result.id]);
    } else if (result.type === 'DOSSIER') {
      this.router.navigate(['/dossiers', result.id]);
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.page++;
      this.search();
    }
  }

  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.search();
    }
  }

  get hasNextPage(): boolean {
    return (this.page + 1) * this.pageSize < this.totalHits;
  }

  get hasPreviousPage(): boolean {
    return this.page > 0;
  }

  truncate(text: string, limit: number): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
}
