import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AnnonceApiService, AnnonceResponse, AnnonceStatus, Page } from '../../services/annonce-api.service';
import { ColumnConfig, RowAction } from '../../components/generic-table.component';
import { ActionButtonConfig } from '../../components/empty-state.component';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { PriceFormatPipe } from '../../pipes/price-format.pipe';
import { FilterPresetService, FilterPreset } from '../../services/filter-preset.service';
import { MobileFilterSheetComponent, FilterConfig } from '../../components/mobile-filter-sheet.component';

interface AppliedFilter {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

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

  filterPanelExpanded = false;
  appliedFilters: AppliedFilter[] = [];
  isMobile = false;
  savedPresets: FilterPreset[] = [];
  showPresetMenu = false;

  private dateFormatPipe = new DateFormatPipe();
  private priceFormatPipe = new PriceFormatPipe();
  private readonly FILTER_CONTEXT = 'annonces';

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
        return this.priceFormatPipe.transform(annonce.price, annonce.currency || 'EUR');
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
    { icon: 'edit', tooltip: 'Modifier', action: 'edit', color: 'primary' }
  ];

  emptyStatePrimaryAction: ActionButtonConfig = {
    label: 'Créer une annonce',
    handler: () => this.createAnnonce()
  };

  emptyStateSecondaryAction: ActionButtonConfig = {
    label: 'Réinitialiser les filtres',
    handler: () => this.resetFilters()
  };

  constructor(
    private annonceApiService: AnnonceApiService,
    private router: Router,
    private route: ActivatedRoute,
    private filterPresetService: FilterPresetService,
    private bottomSheet: MatBottomSheet,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.loadCities();
    this.loadSavedPresets();
    
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
    
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.selectedStatus = params['status'] as AnnonceStatus;
      }
      this.loadAnnonces();
      this.updateAppliedFilters();
    });
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

  loadSavedPresets(): void {
    this.savedPresets = this.filterPresetService.getPresets(this.FILTER_CONTEXT);
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
    this.updateAppliedFilters();
    this.loadAnnonces();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedCity = '';
    this.selectedType = '';
    this.currentPage = 0;
    this.updateAppliedFilters();
    this.loadAnnonces();
  }

  updateAppliedFilters(): void {
    this.appliedFilters = [];

    if (this.searchQuery.trim()) {
      this.appliedFilters.push({
        key: 'searchQuery',
        label: 'Recherche',
        value: this.searchQuery,
        displayValue: this.searchQuery
      });
    }

    if (this.selectedStatus) {
      this.appliedFilters.push({
        key: 'selectedStatus',
        label: 'Statut',
        value: this.selectedStatus,
        displayValue: this.getStatusLabel(this.selectedStatus)
      });
    }

    if (this.selectedCity) {
      this.appliedFilters.push({
        key: 'selectedCity',
        label: 'Ville',
        value: this.selectedCity,
        displayValue: this.selectedCity
      });
    }

    if (this.selectedType) {
      this.appliedFilters.push({
        key: 'selectedType',
        label: 'Type',
        value: this.selectedType,
        displayValue: this.selectedType
      });
    }
  }

  removeFilter(filter: AppliedFilter): void {
    switch (filter.key) {
      case 'searchQuery':
        this.searchQuery = '';
        break;
      case 'selectedStatus':
        this.selectedStatus = '';
        break;
      case 'selectedCity':
        this.selectedCity = '';
        break;
      case 'selectedType':
        this.selectedType = '';
        break;
    }
    this.applyFilters();
  }

  openMobileFilters(): void {
    const filterConfig: FilterConfig[] = [
      {
        key: 'searchQuery',
        label: 'Recherche',
        type: 'text',
        placeholder: 'Rechercher des annonces...'
      },
      {
        key: 'selectedStatus',
        label: 'Statut',
        type: 'select',
        options: [
          { value: AnnonceStatus.DRAFT, label: 'Brouillon' },
          { value: AnnonceStatus.PUBLISHED, label: 'Publié' },
          { value: AnnonceStatus.ACTIVE, label: 'Actif' },
          { value: AnnonceStatus.PAUSED, label: 'En pause' },
          { value: AnnonceStatus.ARCHIVED, label: 'Archivé' }
        ]
      },
      {
        key: 'selectedCity',
        label: 'Ville',
        type: 'select',
        options: this.availableCities.map(city => ({ value: city, label: city }))
      },
      {
        key: 'selectedType',
        label: 'Type',
        type: 'select',
        options: this.availableTypes.map(type => ({ value: type, label: type }))
      }
    ];

    const sheetRef = this.bottomSheet.open(MobileFilterSheetComponent, {
      data: {
        filters: {
          searchQuery: this.searchQuery,
          selectedStatus: this.selectedStatus,
          selectedCity: this.selectedCity,
          selectedType: this.selectedType
        },
        config: filterConfig
      }
    });

    sheetRef.afterDismissed().subscribe(result => {
      if (result?.action === 'apply') {
        this.searchQuery = result.filters.searchQuery || '';
        this.selectedStatus = result.filters.selectedStatus || '';
        this.selectedCity = result.filters.selectedCity || '';
        this.selectedType = result.filters.selectedType || '';
        this.applyFilters();
      } else if (result?.action === 'reset') {
        this.resetFilters();
      }
    });
  }

  saveCurrentFilters(): void {
    const name = prompt('Nom du preset de filtres:');
    if (!name) return;

    const filters = {
      searchQuery: this.searchQuery,
      selectedStatus: this.selectedStatus,
      selectedCity: this.selectedCity,
      selectedType: this.selectedType
    };

    this.filterPresetService.savePreset(this.FILTER_CONTEXT, name, filters);
    this.loadSavedPresets();
  }

  loadPreset(preset: FilterPreset): void {
    const filters = preset.filters;
    this.searchQuery = (filters['searchQuery'] as string) || '';
    this.selectedStatus = (filters['selectedStatus'] as AnnonceStatus) || '';
    this.selectedCity = (filters['selectedCity'] as string) || '';
    this.selectedType = (filters['selectedType'] as string) || '';
    this.applyFilters();
    this.showPresetMenu = false;
  }

  deletePreset(preset: FilterPreset, event: Event): void {
    event.stopPropagation();
    if (confirm(`Supprimer le preset "${preset.name}" ?`)) {
      this.filterPresetService.deletePreset(this.FILTER_CONTEXT, preset.id);
      this.loadSavedPresets();
    }
  }

  togglePresetMenu(): void {
    this.showPresetMenu = !this.showPresetMenu;
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
        return 'badge-status badge-active';
      case AnnonceStatus.ACTIVE:
        return 'badge-status badge-active';
      case AnnonceStatus.PAUSED:
        return 'badge-status badge-paused';
      case AnnonceStatus.DRAFT:
        return 'badge-status badge-draft';
      case AnnonceStatus.ARCHIVED:
        return 'badge-status badge-archived';
      default:
        return 'badge-status';
    }
  }

  getStatusLabel(status: AnnonceStatus): string {
    switch (status) {
      case AnnonceStatus.PUBLISHED:
        return 'Actif';
      case AnnonceStatus.DRAFT:
        return 'Brouillon';
      case AnnonceStatus.ARCHIVED:
        return 'Archivé';
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
