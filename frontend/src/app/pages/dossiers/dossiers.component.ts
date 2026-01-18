import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DossierApiService, DossierResponse, DossierStatus, Page } from '../../services/dossier-api.service';
import { AnnonceApiService, AnnonceResponse } from '../../services/annonce-api.service';
import { ColumnConfig, RowAction, PaginationData } from '../../components/generic-table.component';
import { ActionButtonConfig } from '../../components/empty-state.component';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { PhoneFormatPipe } from '../../pipes/phone-format.pipe';
import { FilterPresetService, FilterPreset } from '../../services/filter-preset.service';
import { MobileFilterSheetComponent, FilterConfig } from '../../components/mobile-filter-sheet.component';
import { DossierCreateDialogComponent } from './dossier-create-dialog.component';
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

  /**
   * Important UX:
   * - Sur desktop, on garde les colonnes métier "complètes" (comme avant) pour éviter l'effet "salade".
   * - Le tableau doit rester lisible (cellules ellipsis + header multi-ligne).
   * - Sur mobile, on réduit naturellement le nombre de colonnes.
   */
  columns: ColumnConfig[] = [];

  private readonly desktopColumns: ColumnConfig[] = [
    // Ajustements de largeur (desktop) pour éviter un scroll horizontal permanent,
    // sans retirer de colonnes.
    { key: 'id', header: 'ID', sortable: true, type: 'number', width: '60px' },
    {
      key: 'annonceTitle',
      header: 'Annonce liée',
      sortable: true,
      width: '160px',
      format: (value: unknown) => this.escapeHtml((value as string) || '—')
    },
    {
      key: 'leadName',
      header: 'Nom du prospect',
      sortable: true,
      width: '150px',
      format: (value: unknown) => this.escapeHtml((value as string) || '—')
    },
    {
      key: 'leadPhone',
      header: 'Téléphone du prospect',
      sortable: true,
      width: '150px',
      format: (value: unknown) => this.escapeHtml(this.phoneFormatPipe.transform((value as string) || '') || '—')
    },
    {
      key: 'leadSource',
      header: 'Source du prospect',
      sortable: true,
      width: '120px',
      format: (_: unknown, row: unknown) => {
        const dossier = row as DossierResponse | undefined | null;
        return this.escapeHtml(dossier?.leadSource || dossier?.source || '—');
      }
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      type: 'custom',
      width: '130px',
      format: (value: unknown) => {
        const status = value as DossierStatus;
        const badgeClass = this.getStatusBadgeClass(status);
        const icon = this.getStatusIcon(status);
        const label = this.getStatusLabel(status);
        return `<span class="${badgeClass}"><span class="material-icons status-icon">${icon}</span><span class="status-text">${this.escapeHtml(label)}</span></span>`;
      }
    },
    {
      key: 'createdAt',
      header: 'Créé le',
      sortable: true,
      type: 'custom',
      width: '120px',
      format: (value: unknown) => this.dateFormatPipe.transform(value as string)
    },
    {
      key: 'updatedAt',
      header: 'Modifié le',
      sortable: true,
      type: 'custom',
      width: '120px',
      format: (value: unknown) => this.dateFormatPipe.transform(value as string)
    }
  ];

  private readonly mobileColumns: ColumnConfig[] = [
    { key: 'id', header: 'ID', sortable: true, type: 'number', width: '70px' },
    {
      key: 'leadName',
      header: 'Prospect',
      sortable: true,
      width: '180px',
      format: (value: unknown) => this.escapeHtml((value as string) || '—')
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      type: 'custom',
      format: (value: unknown) => {
        const status = value as DossierStatus;
        const badgeClass = this.getStatusBadgeClass(status);
        const icon = this.getStatusIcon(status);
        const label = this.getStatusLabel(status);
        return `<span class="${badgeClass}"><span class="material-icons status-icon">${icon}</span><span class="status-text">${this.escapeHtml(label)}</span></span>`;
      }
    },
    {
      key: 'updatedAt',
      header: 'Modifié',
      sortable: true,
      type: 'custom',
      format: (value: unknown) => this.dateFormatPipe.transform(value as string)
    }
  ];

  actions: RowAction[] = [
    { icon: 'launch', tooltip: 'Ouvrir', action: 'view', color: 'primary' },
    { icon: 'phone', tooltip: 'Appeler', action: 'call', color: 'success' },
    { icon: 'message', tooltip: 'Envoyer message', action: 'message', color: 'accent' },
    { icon: 'sync_alt', tooltip: 'Changer statut', action: 'change-status', color: 'warning' }
  ];

  get paginationData(): PaginationData | undefined {
    if (!this.page) return undefined;
    return {
      number: this.page.number,
      totalPages: this.page.totalPages,
      first: this.page.first,
      last: this.page.last
    };
  }

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
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.setupAnnonceAutocomplete();
    this.loadSavedPresets();

    // Default columns before the first breakpoint emission.
    this.configureColumns();
    
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
        this.configureColumns();
      });
    
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.selectedStatus = params['status'] as DossierStatus;
      }
      this.loadDossiers();
      this.updateAppliedFilters();
    });
  }

  private configureColumns(): void {
    this.columns = this.isMobile ? [...this.mobileColumns] : [...this.desktopColumns];
  }

  /**
   * Minimal HTML escaping for values rendered via [innerHTML] in GenericTable.
   */
  private escapeHtml(value: string): string {
    return (value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  onPaginationChange(direction: 'previous' | 'next'): void {
    if (direction === 'previous') {
      this.previousPage();
    } else {
      this.nextPage();
    }
  }

  createDossier(): void {
    const dialogRef = this.dialog.open(DossierCreateDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.openExisting) {
          this.router.navigate(['/dossiers', result.openExisting]);
        } else {
          this.loadDossiers();
          if (result.id) {
            this.router.navigate(['/dossiers', result.id]);
          }
        }
      }
    });
  }

  onRowAction(event: { action: string; row: unknown }): void {
    const dossier = event.row as DossierResponse;
    switch (event.action) {
      case 'view':
        this.viewDossier(dossier.id);
        break;
      case 'call':
        this.callDossier(dossier);
        break;
      case 'message':
        this.messageDossier(dossier);
        break;
      case 'change-status':
        this.changeStatus(dossier);
        break;
    }
  }

  viewDossier(id: number): void {
    this.router.navigate(['/dossiers', id]);
  }

  callDossier(dossier: DossierResponse): void {
    if (dossier.leadPhone) {
      window.location.href = `tel:${dossier.leadPhone}`;
    }
  }

  messageDossier(dossier: DossierResponse): void {
    if (dossier.leadPhone) {
      window.location.href = `sms:${dossier.leadPhone}`;
    }
  }

  changeStatus(dossier: DossierResponse): void {
    console.log('Change status for dossier', dossier.id);
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

  getStatusIcon(status: DossierStatus): string {
    switch (status) {
      case DossierStatus.NEW:
        return 'fiber_new';
      case DossierStatus.QUALIFYING:
        return 'hourglass_empty';
      case DossierStatus.QUALIFIED:
        return 'verified';
      case DossierStatus.APPOINTMENT:
        return 'event';
      case DossierStatus.WON:
        return 'emoji_events';
      case DossierStatus.LOST:
        return 'cancel';
      default:
        return 'label';
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
