import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PortailService, Listing, FilterState } from '../../../services/portail.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-recherche',
    templateUrl: './recherche.component.html',
    styleUrls: ['./recherche.component.scss'],
    imports: [FormsModule]
})
export class RechercheComponent implements OnInit {

  displayedListings: Listing[] = [];
  totalCount = 0;
  totalPages = 0;

  filters: FilterState = {
    tx: '', ville: '', prixMin: null, prixMax: null,
    surfMin: null, surfMax: null, pieces: 0, sort: 'recent', page: 1
  };

  readonly villes = ['Casablanca', 'Rabat', 'Tanger', 'Marrakech', 'Fès', 'Agadir', 'Meknès', 'Oujda', 'Tétouan', 'Salé'];
  leadModalOpen = false;
  selectedListing: Listing | null = null;

  constructor(
    public portailService: PortailService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tx'])     this.filters.tx    = params['tx'];
      if (params['ville'])  this.filters.ville  = params['ville'];
      if (params['prixMax']) this.filters.prixMax = +params['prixMax'];
      this.applyFilters();
    });
  }

  applyFilters(): void {
    this.portailService.searchAnnonces(this.filters).subscribe(res => {
      this.displayedListings = res.content;
      this.totalCount = res.totalElements;
      this.totalPages = Math.ceil(this.totalCount / this.portailService.PAGE_SIZE);
      if (this.totalPages === 0) this.totalPages = 1;
    });
  }

  setTxFilter(tx: string): void { this.filters.tx = tx; this.filters.page = 1; this.applyFilters(); }
  setPiecesFilter(n: number): void { this.filters.pieces = n; this.filters.page = 1; this.applyFilters(); }
  setSort(sort: FilterState['sort']): void { this.filters.sort = sort; this.filters.page = 1; this.applyFilters(); }

  resetFilters(): void {
    this.filters = { tx: '', ville: '', prixMin: null, prixMax: null, surfMin: null, surfMax: null, pieces: 0, sort: 'recent', page: 1 };
    this.applyFilters();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.filters.page = p;
    this.applyFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  navigateToDetail(l: Listing): void { this.router.navigate(['/annonces', l.id]); }
  formatPrice(p: number, tx: 'vente' | 'location'): string { return this.portailService.formatPrice(p, tx); }
}
