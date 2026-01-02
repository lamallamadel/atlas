import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DossierApiService, DossierResponse, DossierStatus, Page } from '../../services/dossier-api.service';
import { ColumnConfig, RowAction } from '../../components/generic-table.component';

@Component({
  selector: 'app-dossiers',
  templateUrl: './dossiers.component.html',
  styleUrls: ['./dossiers.component.css']
})
export class DossiersComponent implements OnInit {
  dossiers: DossierResponse[] = [];
  page: Page<DossierResponse> | null = null;
  loading = false;
  error: string | null = null;

  selectedStatus: DossierStatus | '' = '';
  phoneFilter = '';
  annonceIdFilter = '';
  currentPage = 0;
  pageSize = 10;

  DossierStatus = DossierStatus;

  columns: ColumnConfig[] = [
    { key: 'id', header: 'ID', sortable: true, type: 'number' },
    { key: 'orgId', header: 'ID organisation', sortable: true, type: 'number' },
    { 
      key: 'annonceId', 
      header: 'ID annonce', 
      sortable: true,
      format: (value: unknown) => value ? value.toString() : '-'
    },
    { 
      key: 'leadName', 
      header: 'Nom du prospect', 
      sortable: true,
      format: (value: unknown) => (value as string) || '-'
    },
    { 
      key: 'leadPhone', 
      header: 'Téléphone du prospect', 
      sortable: true,
      format: (value: unknown) => (value as string) || '-'
    },
    { 
      key: 'leadSource', 
      header: 'Source du prospect', 
      sortable: true,
      format: (value: unknown) => (value as string) || '-'
    },
    { 
      key: 'status', 
      header: 'Statut', 
      sortable: true,
      type: 'custom',
      format: (value: unknown) => {
        const status = value as DossierStatus;
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
    { icon: 'visibility', tooltip: 'Voir', action: 'view', color: 'primary' }
  ];

  constructor(
    private dossierApiService: DossierApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDossiers();
  }

  loadDossiers(): void {
    this.loading = true;
    this.error = null;

    const params: {
      page: number;
      size: number;
      status?: DossierStatus;
      leadPhone?: string;
      annonceId?: number;
    } = {
      page: this.currentPage,
      size: this.pageSize
    };

    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }

    if (this.phoneFilter.trim()) {
      params.leadPhone = this.phoneFilter.trim();
    }

    if (this.annonceIdFilter.trim()) {
      const annonceId = parseInt(this.annonceIdFilter.trim(), 10);
      if (!isNaN(annonceId)) {
        params.annonceId = annonceId;
      }
    }

    this.dossierApiService.list(params).subscribe({
      next: (response) => {
        this.page = response;
        this.dossiers = response.content;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Échec du chargement des dossiers. Veuillez réessayer.';
        this.loading = false;
        console.error('Error loading dossiers:', err);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadDossiers();
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.phoneFilter = '';
    this.annonceIdFilter = '';
    this.currentPage = 0;
    this.loadDossiers();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadDossiers();
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadDossiers();
    }
  }

  nextPage(): void {
    if (this.page && !this.page.last) {
      this.currentPage++;
      this.loadDossiers();
    }
  }

  createDossier(): void {
    this.router.navigate(['/dossiers/new']);
  }

  onRowAction(event: { action: string; row: unknown }): void {
    const dossier = event.row as DossierResponse;
    if (event.action === 'view') {
      this.viewDossier(dossier.id);
    }
  }

  viewDossier(id: number): void {
    this.router.navigate(['/dossiers', id]);
  }

  getStatusBadgeClass(status: DossierStatus): string {
    switch (status) {
      case DossierStatus.NEW:
        return 'status-badge status-new';
      case DossierStatus.QUALIFIED:
        return 'status-badge status-qualified';
      case DossierStatus.APPOINTMENT:
        return 'status-badge status-appointment';
      case DossierStatus.WON:
        return 'status-badge status-won';
      case DossierStatus.LOST:
        return 'status-badge status-lost';
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
