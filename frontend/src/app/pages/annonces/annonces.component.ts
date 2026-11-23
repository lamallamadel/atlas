import { Component, OnInit, inject } from '@angular/core';
import { annonceStatusLabel, formatAnnoncePrice } from '../../utils/annonce-format';
import { Router, ActivatedRoute } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AnnonceApiService, AnnonceResponse, AnnonceStatus, Page } from '../../services/annonce-api.service';
import { ColumnConfig, RowAction } from '../../components/generic-table.component';
import { FilterPresetService } from '../../services/filter-preset.service';
import { listStaggerAnimation, itemAnimation } from '../../animations/list-animations';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, CommonModule } from '@angular/common';
import { AnnonceAiBadgesComponent } from '../../components/annonce-ai-badges.component';
import { MobileFilterSheetComponent, FilterConfig } from '../../components/mobile-filter-sheet.component';
import { 
  PageHeaderComponent, 
  FilterBarComponent, 
  DsFilterOption,
  DsButtonComponent, 
  DsBadgeComponent, 
  DsBadgeStatus,
  DsEmptyStateComponent, 
  DsSkeletonComponent,
  DsCardComponent, 
  DsTableComponent, 
  DsCellDirective,
  DsColumn, 
  DsRowAction,
  DsIconComponent,
  DsSelectComponent, 
  DsSelectOption, 
  DsToastService,
  DsDialogService
} from '../../design-system';

@Component({
    selector: 'app-annonces',
    standalone: true,
    templateUrl: './annonces.component.html',
    styleUrls: ['./annonces.component.scss'],
    animations: [listStaggerAnimation, itemAnimation],
    imports: [
      CommonModule,
      FormsModule, DecimalPipe,
      PageHeaderComponent, FilterBarComponent,
      DsButtonComponent, DsBadgeComponent, DsEmptyStateComponent, DsSkeletonComponent,
      DsCardComponent, DsTableComponent, DsCellDirective, DsIconComponent, DsSelectComponent,
      AnnonceAiBadgesComponent,
    ]
})
export class AnnoncesComponent implements OnInit {
  private annonceApiService = inject(AnnonceApiService);
  private router = inject(Router);
  private toastService = inject(DsToastService);
  private dsDialogService = inject(DsDialogService);
  private breakpointObserver = inject(BreakpointObserver);

  annonces: AnnonceResponse[] = [];
  page: Page<AnnonceResponse> | null = null;
  loading = false;
  error: string | null = null;

  viewMode: 'cards' | 'list' = 'cards';
  selectedStatus: AnnonceStatus | '' = '';
  searchQuery = '';
  currentPage = 0;
  pageSize = 10;
  filterPanelExpanded = false;
  isMobile = false;
  
  selectedCity = '';
  selectedType = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  appliedFilters: any[] = [];

  readonly statusFilters: DsFilterOption[] = [
    { value: 'DRAFT', label: 'Brouillons' },
    { value: 'PUBLISHED', label: 'En ligne' },
    { value: 'SUSPENDED', label: 'Suspendues' },
    { value: 'ARCHIVED', label: 'Archivées' }
  ];

  readonly cityOptions: DsSelectOption[] = [
    { value: '', label: 'Toutes les villes' },
    { value: 'Tanger', label: 'Tanger' },
    { value: 'Tétouan', label: 'Tétouan' },
    { value: 'Casablanca', label: 'Casablanca' },
    { value: 'Rabat', label: 'Rabat' },
    { value: 'Marrakech', label: 'Marrakech' },
    { value: 'Fès', label: 'Fès' },
    { value: 'Agadir', label: 'Agadir' }
  ];

  readonly typeOptions: DsSelectOption[] = [
    { value: '', label: 'Tous les types' },
    { value: 'SALE', label: 'Vente' },
    { value: 'RENT', label: 'Location' }
  ];

  dsTableColumns: DsColumn<any>[] = [
    { key: 'id', header: 'ID', width: '80px' },
    { key: 'title', header: 'Titre' },
    { key: 'city', header: 'Ville' },
    { key: 'price', header: 'Prix', cell: (a) => formatAnnoncePrice(a) },
    { key: 'status', header: 'Statut', cell: (a) => annonceStatusLabel(a.status) },
    { key: 'ai', header: 'Alertes IA' }
  ];

  dsTableRowActions: DsRowAction<any>[] = [
    { icon: 'eye', label: 'Voir', action: 'view', ariaLabel: 'Voir l\'annonce' },
    { icon: 'edit', label: 'Modifier', action: 'edit', ariaLabel: 'Modifier l\'annonce' }
  ];

  get annoncesAsTableRows(): any[] { return this.annonces; }

  ngOnInit(): void {
    this.loadAnnonces();
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => { this.isMobile = result.matches; });
  }

  loadAnnonces(): void {
    this.loading = true;
    this.annonceApiService.list({
      page: this.currentPage,
      size: this.pageSize,
      q: this.searchQuery || undefined,
      status: this.selectedStatus || undefined
    }).subscribe({
      next: (response) => {
        this.page = response;
        this.annonces = response.content;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des annonces';
        this.loading = false;
        this.toastService.error(this.error!);
      }
    });
  }

  onStatusChange(status: any): void {
    this.selectedStatus = status;
    this.loadAnnonces();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.loadAnnonces();
  }

  applyFilters(): void {
    this.loadAnnonces();
  }

  toggleFilters(): void {
    if (this.isMobile) {
      this.openMobileFilters();
    } else {
      this.filterPanelExpanded = !this.filterPanelExpanded;
    }
  }

  openMobileFilters(): void {
    const dialogRef = this.dsDialogService.open<any>(MobileFilterSheetComponent, {
      panelClass: 'ds-dialog-panel--bottom-sheet',
      data: {
        filters: {
          city: this.selectedCity,
          type: this.selectedType,
          minPrice: this.minPrice,
          maxPrice: this.maxPrice
        },
        config: [
          { key: 'city', label: 'Ville', type: 'select', options: this.cityOptions },
          { key: 'type', label: 'Type', type: 'select', options: this.typeOptions },
          { key: 'minPrice', label: 'Prix min', type: 'text', placeholder: '0' },
          { key: 'maxPrice', label: 'Prix max', type: 'text', placeholder: 'Sans limite' }
        ] as FilterConfig[]
      }
    });

    dialogRef.closed.subscribe(result => {
      if (result?.action === 'apply') {
        this.selectedCity = result.filters.city;
        this.selectedType = result.filters.type;
        this.minPrice = result.filters.minPrice;
        this.maxPrice = result.filters.maxPrice;
        this.applyFilters();
      } else if (result?.action === 'reset') {
        this.resetFilters();
      }
    });
  }

  resetFilters(): void {
    this.selectedCity = '';
    this.selectedType = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.applyFilters();
  }

  removeFilter(filter: any): void { /* ... */ }

  createAnnonce(): void { this.router.navigate(['/pro/annonces/new']); }
  goToAnnonce(id: number): void { this.router.navigate(['/pro/annonces', id]); }

  onDsTableRowClick(row: any): void { this.goToAnnonce(row.id); }
  onDsTableRowAction(event: { action: string; row: any }): void {
    if (event.action === 'view') this.goToAnnonce(event.row.id);
    if (event.action === 'edit') this.router.navigate(['/pro/annonces', event.row.id, 'edit']);
  }

  getAnnonceBadgeStatus(status: string): DsBadgeStatus {
    switch (status) {
      case 'PUBLISHED':
      case 'ACTIVE': return 'active';
      case 'DRAFT': return 'draft';
      case 'SUSPENDED':
      case 'PAUSED': return 'paused';
      case 'ARCHIVED': return 'archived';
      default: return 'neutral';
    }
  }

  countByStatus(...statuses: string[]): number {
    return this.annonces.filter(a => statuses.includes(a.status)).length;
  }

  statusLabel(status: string): string { return annonceStatusLabel(status); }
  formatPrice(a: AnnonceResponse): string { return formatAnnoncePrice(a); }

  trackByAnnonceId(index: number, a: AnnonceResponse): number { return a.id; }
  previousPage(): void { if (this.currentPage > 0) { this.currentPage--; this.loadAnnonces(); } }
  nextPage(): void { if (this.page && !this.page.last) { this.currentPage++; this.loadAnnonces(); } }
}
