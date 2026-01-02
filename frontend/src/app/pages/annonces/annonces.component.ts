import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnnonceApiService, AnnonceResponse, AnnonceStatus, Page } from '../../services/annonce-api.service';
import { ColumnConfig, RowAction } from '../../components/generic-table.component';

@Component({
  selector: 'app-annonces',
  templateUrl: './annonces.component.html',
  styleUrls: ['./annonces.component.css']
})
export class AnnoncesComponent implements OnInit {
  annonces: AnnonceResponse[] = [];
  page: Page<AnnonceResponse> | null = null;
  loading = false;
  error: string | null = null;

  searchQuery = '';
  selectedStatus: AnnonceStatus | '' = '';
  selectedCity = '';
  selectedType = '';
  currentPage = 0;
  pageSize = 10;

  availableCities: string[] = [];
  availableTypes = ['SALE', 'RENT', 'LEASE', 'EXCHANGE'];

  AnnonceStatus = AnnonceStatus;

  columns: ColumnConfig[] = [
    { key: 'id', header: 'ID', sortable: true, type: 'number' },
    { 
      key: 'title', 
      header: 'Titre', 
      sortable: true,
      type: 'custom',
      format: (value: unknown, row: unknown) => {
        const annonce = row as AnnonceResponse;
        const title = `<strong>${value}</strong>`;
        const description = annonce.description 
          ? `<div class="description-preview">${annonce.description.length > 50 ? annonce.description.substring(0, 50) + '...' : annonce.description}</div>`
          : '';
        return title + description;
      }
    },
    { 
      key: 'category', 
      header: 'Catégorie', 
      sortable: true,
      format: (value: unknown) => (value as string) || '-'
    },
    { 
      key: 'city', 
      header: 'Ville', 
      sortable: true,
      format: (value: unknown) => (value as string) || '-'
    },
    { 
      key: 'price', 
      header: 'Prix', 
      sortable: true,
      type: 'custom',
      format: (value: unknown, row: unknown) => {
        const annonce = row as AnnonceResponse;
        if (annonce.price === undefined) return '-';
        const curr = annonce.currency || 'EUR';
        return `${annonce.price.toFixed(2)} ${curr}`;
      }
    },
    { 
      key: 'status', 
      header: 'Statut', 
      sortable: true,
      type: 'custom',
      format: (value: unknown) => {
        const status = value as AnnonceStatus;
        const badgeClass = this.getStatusBadgeClass(status);
        return `<span class="${badgeClass}">${status}</span>`;
      }
    },
    { 
      key: 'createdAt', 
      header: 'Créé le', 
      sortable: true,
      type: 'custom',
      format: (value: unknown) => this.formatDate(value as string)
    },
    { 
      key: 'updatedAt', 
      header: 'Modifié le', 
      sortable: true,
      type: 'custom',
      format: (value: unknown) => this.formatDate(value as string)
    }
  ];

  actions: RowAction[] = [
    { icon: 'edit', tooltip: 'Modifier', action: 'edit', color: 'primary' }
  ];

  constructor(
    private annonceApiService: AnnonceApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCities();
    this.loadAnnonces();
  }

  loadCities(): void {
    this.annonceApiService.getDistinctCities().subscribe({
      next: (cities) => {
        this.availableCities = cities;
      },
      error: (err) => {
        console.error('Error loading cities:', err);
      }
    });
  }

  loadAnnonces(): void {
    this.loading = true;
    this.error = null;

    const params: {
      page: number;
      size: number;
      q?: string;
      status?: AnnonceStatus;
      city?: string;
      type?: string;
    } = {
      page: this.currentPage,
      size: this.pageSize
    };

    if (this.searchQuery.trim()) {
      params.q = this.searchQuery.trim();
    }

    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }

    if (this.selectedCity) {
      params.city = this.selectedCity;
    }

    if (this.selectedType) {
      params.type = this.selectedType;
    }

    this.annonceApiService.list(params).subscribe({
      next: (response) => {
        this.page = response;
        this.annonces = response.content;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Échec du chargement des annonces. Veuillez réessayer.';
        this.loading = false;
        console.error('Error loading annonces:', err);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadAnnonces();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedCity = '';
    this.selectedType = '';
    this.currentPage = 0;
    this.loadAnnonces();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadAnnonces();
  }

  onStatusChange(): void {
    this.currentPage = 0;
    this.loadAnnonces();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadAnnonces();
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadAnnonces();
    }
  }

  nextPage(): void {
    if (this.page && !this.page.last) {
      this.currentPage++;
      this.loadAnnonces();
    }
  }

  createAnnonce(): void {
    this.router.navigate(['/annonces/new']);
  }

  onRowAction(event: { action: string; row: unknown }): void {
    const annonce = event.row as AnnonceResponse;
    if (event.action === 'edit') {
      this.editAnnonce(annonce.id);
    }
  }

  editAnnonce(id: number): void {
    this.router.navigate(['/annonces', id, 'edit']);
  }

  getStatusBadgeClass(status: AnnonceStatus): string {
    switch (status) {
      case AnnonceStatus.PUBLISHED:
        return 'status-badge status-published';
      case AnnonceStatus.DRAFT:
        return 'status-badge status-draft';
      case AnnonceStatus.ARCHIVED:
        return 'status-badge status-archived';
      default:
        return 'status-badge';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getPageNumbers(): number[] {
    if (!this.page) return [];
    const totalPages = this.page.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 0; i < 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages - 1);
      } else if (current >= totalPages - 4) {
        pages.push(0);
        pages.push(-1);
        for (let i = totalPages - 5; i < totalPages; i++) pages.push(i);
      } else {
        pages.push(0);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages - 1);
      }
    }

    return pages;
  }
}
