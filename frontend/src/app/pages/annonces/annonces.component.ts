import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnnonceApiService, AnnonceResponse, AnnonceStatus, Page } from '../../services/annonce-api.service';

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
  currentPage = 0;
  pageSize = 10;

  AnnonceStatus = AnnonceStatus;

  constructor(
    private annonceApiService: AnnonceApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAnnonces();
  }

  loadAnnonces(): void {
    this.loading = true;
    this.error = null;

    const params: {
      page: number;
      size: number;
      q?: string;
      status?: AnnonceStatus;
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

    this.annonceApiService.list(params).subscribe({
      next: (response) => {
        this.page = response;
        this.annonces = response.content;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load annonces. Please try again.';
        this.loading = false;
        console.error('Error loading annonces:', err);
      }
    });
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

  formatPrice(price: number | undefined, currency: string | undefined): string {
    if (price === undefined) return '-';
    const curr = currency || 'EUR';
    return `${price.toFixed(2)} ${curr}`;
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
