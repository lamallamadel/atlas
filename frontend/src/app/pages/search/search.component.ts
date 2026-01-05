import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchApiService, SearchResult } from '../../services/search-api.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  searchQuery = '';
  selectedType = '';
  searchResults: SearchResult[] = [];
  totalHits = 0;
  elasticsearchAvailable = false;
  isLoading = false;
  error = '';
  page = 0;
  pageSize = 20;

  filters: any = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchApiService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.selectedType = params['type'] || '';
      if (this.searchQuery) {
        this.search();
      }
    });
  }

  search() {
    this.isLoading = true;
    this.error = '';

    this.searchService.search(this.searchQuery, this.selectedType, this.filters, this.page, this.pageSize)
      .subscribe({
        next: (response) => {
          this.searchResults = response.results;
          this.totalHits = response.totalHits;
          this.elasticsearchAvailable = response.elasticsearchAvailable;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Search failed. Please try again.';
          this.isLoading = false;
        }
      });
  }

  onSearchQueryChange() {
    this.page = 0;
    this.updateQueryParams();
    this.search();
  }

  onTypeChange() {
    this.page = 0;
    this.updateQueryParams();
    this.search();
  }

  updateQueryParams() {
    const queryParams: any = {};
    if (this.searchQuery) {
      queryParams.q = this.searchQuery;
    }
    if (this.selectedType) {
      queryParams.type = this.selectedType;
    }
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }

  navigateToResult(result: SearchResult) {
    if (result.type === 'annonce') {
      this.router.navigate(['/annonces', result.id]);
    } else if (result.type === 'dossier') {
      this.router.navigate(['/dossiers', result.id]);
    }
  }

  truncate(text: string, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  nextPage() {
    this.page++;
    this.search();
  }

  previousPage() {
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
}
