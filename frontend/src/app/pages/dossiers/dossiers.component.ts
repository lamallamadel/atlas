import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DossierApiService, DossierResponse, DossierStatus, Page } from '../../services/dossier-api.service';
import { AnnonceApiService, AnnonceResponse } from '../../services/annonce-api.service';
import { ColumnConfig, RowAction } from '../../components/generic-table.component';
import { ActionButtonConfig } from '../../components/empty-state.component';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { PhoneFormatPipe } from '../../pipes/phone-format.pipe';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';

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
  annonceSearchControl = new FormControl<string | AnnonceResponse>('');
  filteredAnnonces!: Observable<AnnonceResponse[]>;
  selectedAnnonceId: number | null = null;
  currentPage = 0;
  pageSize = 10;

  DossierStatus = DossierStatus;

  private dateFormatPipe = new DateFormatPipe();
  private phoneFormatPipe = new PhoneFormatPipe();

  columns: ColumnConfig[] = [
    { key: 'id', header: 'ID', sortable: true, type: 'number' },
    { 
      key: 'annonceTitle', 
      header: 'Annonce', 
      sortable: true,
      format: (value: unknown) => (value as string) || '—'
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
      format: (value: unknown) => this.phoneFormatPipe.transform(value as string) || '-'
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
        const label = this.getStatusLabel(status);
        return `<span class="${badgeClass}">${label}</span>`;
      }
    },
    { 
      key: 'createdAt', 
      header: 'Créé le', 
      sortable: true,
      type: 'custom',
      format: (value: unknown) => this.dateFormatPipe.transform(value as string)
    },
    { 
      key: 'updatedAt', 
      header: 'Modifié le', 
      sortable: true,
      type: 'custom',
      format: (value: unknown) => this.dateFormatPipe.transform(value as string)
    }
  ];

  actions: RowAction[] = [
    { icon: 'visibility', tooltip: 'Voir', action: 'view', color: 'primary' }
  ];

  emptyStatePrimaryAction: ActionButtonConfig = {
    label: 'Créer un dossier',
    handler: () => this.createDossier()
  };

  emptyStateSecondaryAction: ActionButtonConfig = {
    label: 'Effacer les filtres',
    handler: () => this.clearFilters()
  };

  constructor(
    private dossierApiService: DossierApiService,
    private annonceApiService: AnnonceApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.setupAnnonceAutocomplete();
    
    // Check for query parameters and apply filters
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.selectedStatus = params['status'] as DossierStatus;
      }
      this.loadDossiers();
    });
  }

  setupAnnonceAutocomplete(): void {
    this.filteredAnnonces = this.annonceSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const term = typeof value === 'string' ? value : (value?.title || '');
        if (!term || term.trim().length === 0) {
          return this.annonceApiService.list({ size: 20 }).pipe(map(page => page.content));
        }
        return this.annonceApiService.list({ q: term, size: 20 }).pipe(map(page => page.content));
      })
    );
  }

  displayAnnonceFn(annonce: AnnonceResponse | null): string {
    if (!annonce) return '';
    return `${annonce.title || 'Sans titre'} (#${annonce.id})`;
  }

  onAnnonceSelected(annonce: AnnonceResponse): void {
    this.selectedAnnonceId = annonce.id;
    this.annonceIdFilter = String(annonce.id);
  }

  clearAnnonceSelection(): void {
    this.selectedAnnonceId = null;
    this.annonceIdFilter = '';
    this.annonceSearchControl.setValue('', { emitEvent: false });
  }

  private syncAnnonceFilterFromControl(): void {
    const v = this.annonceSearchControl.value;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (!trimmed) {
        // No text -> clear selection
        this.selectedAnnonceId = null;
        this.annonceIdFilter = '';
        return;
      }
      const parsed = parseInt(trimmed, 10);
      if (!isNaN(parsed)) {
        this.selectedAnnonceId = null;
        this.annonceIdFilter = String(parsed);
      }
    }
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

    if (this.selectedAnnonceId !== null) {
      params.annonceId = this.selectedAnnonceId;
    } else if (this.annonceIdFilter.trim()) {
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
    this.syncAnnonceFilterFromControl();
    this.currentPage = 0;
    this.loadDossiers();
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.phoneFilter = '';
    this.clearAnnonceSelection();
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

  onRowClick(row: unknown): void {
    const dossier = row as DossierResponse;
    this.viewDossier(dossier.id);
  }

  getStatusBadgeClass(status: DossierStatus): string {
    switch (status) {
      case DossierStatus.NEW:
        return 'badge-status badge-new';
      case DossierStatus.QUALIFYING:
        return 'badge-status badge-qualifying';
      case DossierStatus.QUALIFIED:
        return 'badge-status badge-qualified';
      case DossierStatus.APPOINTMENT:
        return 'badge-status badge-appointment';
      case DossierStatus.WON:
        return 'badge-status badge-won';
      case DossierStatus.LOST:
        return 'badge-status badge-lost';
      default:
        return 'badge-status';
    }
  }

  getStatusLabel(status: DossierStatus): string {
    switch (status) {
      case DossierStatus.NEW:
        return 'Nouveau';
      case DossierStatus.QUALIFIED:
        return 'Qualifié';
      case DossierStatus.APPOINTMENT:
        return 'Rendez-vous';
      case DossierStatus.WON:
        return 'Gagné';
      case DossierStatus.LOST:
        return 'Perdu';
      default:
        return status;
    }
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
