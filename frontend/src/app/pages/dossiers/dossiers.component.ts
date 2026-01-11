import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DossierApiService, DossierResponse, DossierStatus, Page } from '../../services/dossier-api.service';
import { AnnonceApiService, AnnonceResponse } from '../../services/annonce-api.service';
import { ColumnConfig, RowAction } from '../../components/generic-table.component';
import { ActionButtonConfig } from '../../components/empty-state.component';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { PhoneFormatPipe } from '../../pipes/phone-format.pipe';
import { FilterPresetService, FilterPreset } from '../../services/filter-preset.service';
import { MobileFilterSheetComponent, FilterConfig } from '../../components/mobile-filter-sheet.component';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { listStaggerAnimation, itemAnimation } from '../../animations/list-animations';

interface AppliedFilter {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

@Component({
  selector: 'app-dossiers',
  templateUrl: './dossiers.component.html',
  styleUrls: ['./dossiers.component.css'],
  animations: [listStaggerAnimation, itemAnimation]
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

  filterPanelExpanded = false;
  appliedFilters: AppliedFilter[] = [];
  isMobile = false;
  savedPresets: FilterPreset[] = [];
  showPresetMenu = false;

  private dateFormatPipe = new DateFormatPipe();
  private phoneFormatPipe = new PhoneFormatPipe();
  private readonly FILTER_CONTEXT = 'dossiers';

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

  get emptyStateMessage(): string {
    return this.appliedFilters.length > 0
      ? 'Aucun dossier ne correspond à vos filtres'
      : 'Vous n\'avez encore aucun dossier';
  }

  get emptyStateSubtext(): string {
    return this.appliedFilters.length > 0
      ? 'Essayez de modifier ou réinitialiser les filtres pour voir d\'autres résultats.'
      : '';
  }

  get emptyStatePrimaryAction(): ActionButtonConfig {
    return {
      label: 'Créer un dossier',
      handler: () => this.createDossier()
    };
  }

  get emptyStateSecondaryAction(): ActionButtonConfig | undefined {
    return this.appliedFilters.length > 0
      ? {
          label: 'Réinitialiser les filtres',
          handler: () => this.clearFilters()
        }
      : undefined;
  }

  constructor(
    private dossierApiService: DossierApiService,
    private annonceApiService: AnnonceApiService,
    private router: Router,
    private route: ActivatedRoute,
    private filterPresetService: FilterPresetService,
    private bottomSheet: MatBottomSheet,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.setupAnnonceAutocomplete();
    this.loadSavedPresets();
    
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
    
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.selectedStatus = params['status'] as DossierStatus;
      }
      this.loadDossiers();
      this.updateAppliedFilters();
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

  loadSavedPresets(): void {
    this.savedPresets = this.filterPresetService.getPresets(this.FILTER_CONTEXT);
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
    this.updateAppliedFilters();
    this.loadDossiers();
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.phoneFilter = '';
    this.clearAnnonceSelection();
    this.currentPage = 0;
    this.updateAppliedFilters();
    this.loadDossiers();
  }

  updateAppliedFilters(): void {
    this.appliedFilters = [];

    if (this.selectedStatus) {
      this.appliedFilters.push({
        key: 'selectedStatus',
        label: 'Statut',
        value: this.selectedStatus,
        displayValue: this.getStatusLabel(this.selectedStatus)
      });
    }

    if (this.phoneFilter.trim()) {
      this.appliedFilters.push({
        key: 'phoneFilter',
        label: 'Téléphone',
        value: this.phoneFilter,
        displayValue: this.phoneFilter
      });
    }

    if (this.selectedAnnonceId !== null) {
      const annonceValue = this.annonceSearchControl.value;
      const displayValue = typeof annonceValue === 'object' && annonceValue 
        ? this.displayAnnonceFn(annonceValue)
        : `ID: ${this.selectedAnnonceId}`;
      
      this.appliedFilters.push({
        key: 'annonceId',
        label: 'Annonce',
        value: String(this.selectedAnnonceId),
        displayValue
      });
    } else if (this.annonceIdFilter.trim()) {
      this.appliedFilters.push({
        key: 'annonceId',
        label: 'Annonce',
        value: this.annonceIdFilter,
        displayValue: `ID: ${this.annonceIdFilter}`
      });
    }
  }

  removeFilter(filter: AppliedFilter): void {
    switch (filter.key) {
      case 'selectedStatus':
        this.selectedStatus = '';
        break;
      case 'phoneFilter':
        this.phoneFilter = '';
        break;
      case 'annonceId':
        this.clearAnnonceSelection();
        break;
    }
    this.onFilterChange();
  }

  openMobileFilters(): void {
    const filterConfig: FilterConfig[] = [
      {
        key: 'selectedStatus',
        label: 'Statut',
        type: 'select',
        options: [
          { value: DossierStatus.NEW, label: 'Nouveau' },
          { value: DossierStatus.QUALIFIED, label: 'Qualifié' },
          { value: DossierStatus.APPOINTMENT, label: 'Rendez-vous' },
          { value: DossierStatus.WON, label: 'Gagné' },
          { value: DossierStatus.LOST, label: 'Perdu' }
        ]
      },
      {
        key: 'phoneFilter',
        label: 'Téléphone',
        type: 'text',
        placeholder: 'Filtrer par téléphone...'
      },
      {
        key: 'annonceIdFilter',
        label: 'ID Annonce',
        type: 'text',
        placeholder: 'ID de l\'annonce...'
      }
    ];

    const sheetRef = this.bottomSheet.open(MobileFilterSheetComponent, {
      data: {
        filters: {
          selectedStatus: this.selectedStatus,
          phoneFilter: this.phoneFilter,
          annonceIdFilter: this.annonceIdFilter
        },
        config: filterConfig
      }
    });

    sheetRef.afterDismissed().subscribe(result => {
      if (result?.action === 'apply') {
        this.selectedStatus = result.filters.selectedStatus || '';
        this.phoneFilter = result.filters.phoneFilter || '';
        this.annonceIdFilter = result.filters.annonceIdFilter || '';
        if (this.annonceIdFilter) {
          const parsed = parseInt(this.annonceIdFilter, 10);
          if (!isNaN(parsed)) {
            this.selectedAnnonceId = parsed;
          }
        }
        this.onFilterChange();
      } else if (result?.action === 'reset') {
        this.clearFilters();
      }
    });
  }

  saveCurrentFilters(): void {
    const name = prompt('Nom du preset de filtres:');
    if (!name) return;

    const filters = {
      selectedStatus: this.selectedStatus,
      phoneFilter: this.phoneFilter,
      annonceIdFilter: this.annonceIdFilter,
      selectedAnnonceId: this.selectedAnnonceId
    };

    this.filterPresetService.savePreset(this.FILTER_CONTEXT, name, filters);
    this.loadSavedPresets();
  }

  loadPreset(preset: FilterPreset): void {
    const filters = preset.filters;
    this.selectedStatus = (filters['selectedStatus'] as DossierStatus) || '';
    this.phoneFilter = (filters['phoneFilter'] as string) || '';
    this.annonceIdFilter = (filters['annonceIdFilter'] as string) || '';
    this.selectedAnnonceId = (filters['selectedAnnonceId'] as number) || null;
    
    if (this.annonceIdFilter) {
      this.annonceSearchControl.setValue(this.annonceIdFilter, { emitEvent: false });
    } else {
      this.annonceSearchControl.setValue('', { emitEvent: false });
    }
    
    this.onFilterChange();
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

  trackByAnnonce(index: number, annonce: AnnonceResponse): number {
    return annonce.id;
  }

  trackByPreset(index: number, preset: FilterPreset): string {
    return preset.id;
  }

  trackByFilter(index: number, filter: AppliedFilter): string {
    return filter.key;
  }

  trackByPageNum(index: number, pageNum: number): number {
    return pageNum;
  }
}
