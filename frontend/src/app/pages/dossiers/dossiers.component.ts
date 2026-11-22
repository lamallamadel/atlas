import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DossierApiService, DossierResponse, DossierStatus, Page } from '../../services/dossier-api.service';
import { AnnonceApiService, AnnonceResponse } from '../../services/annonce-api.service';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { PhoneFormatPipe } from '../../pipes/phone-format.pipe';
import { FilterPresetService } from '../../services/filter-preset.service';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { DossierAction, MobileDossierCardComponent } from '../../components/mobile-dossier-card.component';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';
import { DossierCreateDialogComponent } from './dossier-create-dialog.component';
import { LeadImportDialogComponent } from '../../components/lead-import-dialog.component';
import { LeadExportDialogComponent } from '../../components/lead-export-dialog.component';
import { ExportService } from '../../services/export.service';
import { DossierFilterApiService } from '../../services/dossier-filter-api.service';
import { MobileAction, MobileActionSheetComponent } from '../../components/mobile-action-sheet.component';
import { Observable, Subject, of, timer } from 'rxjs';
import { catchError, debounceTime, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { KanbanBoardComponent } from '../../components/kanban-board.component';
import { 
  PageHeaderComponent, 
  FilterBarComponent, 
  DsFilterOption,
  DsButtonComponent, 
  DsBadgeComponent, 
  DsEmptyStateComponent, 
  DsSkeletonComponent,
  DsCardComponent, 
  DsTableComponent, 
  DsColumn, 
  DsRowAction,
  DsIconComponent,
  DsToastService,
  DsTab,
  DsDialogService,
  DsSelectComponent,
  DsSelectOption,
  DsInputComponent
} from '../../design-system';
import { CommonModule } from '@angular/common';

interface AppliedFilter {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

@Component({
    selector: 'app-dossiers',
    standalone: true,
    templateUrl: './dossiers.component.html',
    styleUrls: ['./dossiers.component.scss'],
    imports: [
      CommonModule,
      FormsModule, 
      ReactiveFormsModule,
      KanbanBoardComponent, 
      MobileDossierCardComponent,
      PageHeaderComponent, 
      FilterBarComponent,
      DsButtonComponent, 
      DsBadgeComponent,
      DsEmptyStateComponent, 
      DsSkeletonComponent,
      DsCardComponent, 
      DsTableComponent, 
      DsIconComponent,
      DsSelectComponent,
      DsInputComponent,
    ]
})
export class DossiersComponent implements OnInit {
  private dossierApiService = inject(DossierApiService);
  private annonceApiService = inject(AnnonceApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private filterPresetService = inject(FilterPresetService);
  private userPreferencesService = inject(UserPreferencesService);
  private breakpointObserver = inject(BreakpointObserver);
  private dsDialogService = inject(DsDialogService);
  private exportService = inject(ExportService);
  private dossierFilterApi = inject(DossierFilterApiService);
  private toastService = inject(DsToastService);
  private destroyRef = inject(DestroyRef);

  /** Chaque rechargement annule la requête précédente : seule la dernière réponse s'affiche. */
  private reload$ = new Subject<void>();

  dossiers: DossierResponse[] = [];
  page: Page<DossierResponse> | null = null;
  loading = false;
  error: string | null = null;

  viewMode: 'list' | 'kanban' = 'list';
  selectedStatus: DossierStatus | '' = '';
  phoneFilter = '';
  sourceFilter = '';
  searchQuery = '';
  annonceSearchControl = new FormControl<string | AnnonceResponse>('');
  quickFilterControl = new FormControl<string>('');
  filteredAnnonces!: Observable<AnnonceResponse[]>;
  selectedAnnonceId: number | null = null;
  currentPage = 0;
  pageSize = 10;
  isMobile = false;
  filterPanelExpanded = false;
  appliedFilters: AppliedFilter[] = [];

  readonly statusFilters: DsFilterOption[] = [
    { value: 'NEW',           label: 'Nouveaux' },
    { value: 'QUALIFYING',    label: 'En qualification' },
    { value: 'QUALIFIED',     label: 'Qualifiés' },
    { value: 'APPOINTMENT',   label: 'RDV' },
    { value: 'WON',           label: 'Gagnés' },
    { value: 'LOST',          label: 'Perdus' },
  ];

  private static readonly STATUS_LABELS: Record<string, string> = {
    NEW: 'Nouveau', QUALIFYING: 'En qualification', QUALIFIED: 'Qualifié',
    APPOINTMENT: 'RDV', WON: 'Gagné', LOST: 'Perdu',
  };

  dsTableColumns: DsColumn<any>[] = [
    { key: 'id', header: 'ID', width: '80px' },
    { key: 'leadName', header: 'Nom du prospect' },
    { key: 'leadPhone', header: 'Téléphone' },
    { key: 'status', header: 'Statut', cell: (d) => DossiersComponent.STATUS_LABELS[d.status] ?? d.status ?? '' },
    { key: 'updatedAt', header: 'Mis à jour', cell: (d) => DossiersComponent.formatDate(d.updatedAt) }
  ];

  /** « 20/11/2026 18:29 » au lieu de l'horodatage ISO brut. */
  static formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  dsTableRowActions: DsRowAction<any>[] = [
    { icon: 'eye', label: 'Voir', action: 'view', ariaLabel: 'Voir le dossier' },
    { icon: 'edit', label: 'Modifier', action: 'edit', ariaLabel: 'Modifier le dossier' },
    { icon: 'trash', label: 'Supprimer', action: 'delete', ariaLabel: 'Supprimer le dossier' }
  ];

  constructor() {
    this.reload$.pipe(
      switchMap(() => this.dossierApiService.list({
        page: this.currentPage,
        size: this.pageSize,
        status: this.selectedStatus || undefined,
        leadPhone: this.phoneFilter.trim() || undefined,
        leadSource: this.sourceFilter.trim() || undefined,
        annonceId: this.selectedAnnonceId || undefined,
        q: this.searchQuery.trim() || undefined
      }).pipe(
        map(response => ({ response: response as Page<DossierResponse> | null })),
        catchError(() => of({ response: null as Page<DossierResponse> | null }))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ response }) => {
      this.loading = false;
      if (response) {
        this.page = response;
        this.dossiers = response.content;
      } else {
        this.error = 'Échec du chargement des dossiers';
        this.toastService.error(this.error);
      }
    });
  }

  ngOnInit(): void {
    this.setupAnnonceAutocomplete();
    this.searchInput$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(q => {
      this.searchQuery = q;
      this.reloadFromFirstPage();
    });
    // Annulable : Réinitialiser / retirer la puce pendant les 300 ms ne doit pas remettre la source.
    this.sourceInput$.pipe(
      switchMap(source => timer(300).pipe(map(() => source), takeUntil(this.cancelSource$))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(source => {
      this.sourceFilter = source;
      this.refreshAppliedFilters();
      this.reloadFromFirstPage();
    });
    this.annonceSearch$.pipe(
      debounceTime(300),
      switchMap(term => this.annonceApiService.list({ q: term || undefined, size: 50, sort: 'updatedAt,desc' }).pipe(
        catchError(() => of(null))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(page => { if (page) this.setAnnonceOptions(page.content); });
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => { this.isMobile = result.matches; });

    this.route.queryParams.subscribe(params => {
      if (params['status']) this.selectedStatus = params['status'] as DossierStatus;
      if (params['source']) this.sourceFilter = params['source'];
      this.refreshAppliedFilters();
      this.loadDossiers();
    });
  }

  loadDossiers(): void {
    this.loading = true;
    this.reload$.next();
  }

  onStatusFilterChange(status: any): void {
    this.selectedStatus = status;
    this.loadDossiers();
  }

  /** Recherche dans le nom ou le téléphone, côté serveur, 300 ms après la dernière frappe. */
  onSearchChange(query: string): void {
    this.searchInput$.next(query ?? '');
  }

  openAdvancedFilters(): void {
    this.filterPanelExpanded = !this.filterPanelExpanded;
    if (this.filterPanelExpanded && this.annonceOptions.length <= 1) this.loadAnnonceOptions();
  }

  // ---------- Filtres avancés ----------

  annonceOptions: DsSelectOption[] = [{ value: '', label: 'Toutes les annonces' }];
  annonceFilterValue = '';
  annonceSearchTerm = '';
  private searchInput$ = new Subject<string>();
  private sourceInput$ = new Subject<string>();
  private cancelSource$ = new Subject<void>();
  private annonceSearch$ = new Subject<string>();

  /** 50 annonces les plus récentes ; « Rechercher une annonce » interroge le serveur pour les autres. */
  private loadAnnonceOptions(): void {
    this.annonceSearch$.next('');
  }

  onAnnonceSearchChange(term: string): void {
    this.annonceSearchTerm = term ?? '';
    this.annonceSearch$.next(this.annonceSearchTerm.trim());
  }

  private setAnnonceOptions(annonces: AnnonceResponse[]): void {
    const options: DsSelectOption[] = annonces.map(a => ({
      value: String(a.id),
      label: `${a.title || 'Sans titre'}${a.city ? ' — ' + a.city : ''}`
    }));
    // L'annonce sélectionnée reste dans la liste même si la recherche ne la renvoie pas.
    const selected = this.annonceOptions.find(o => o.value && o.value === this.annonceFilterValue);
    if (selected && !options.some(o => o.value === selected.value)) options.unshift(selected);
    this.annonceOptions = [{ value: '', label: 'Toutes les annonces' }, ...options];
  }

  onAnnonceFilterChange(value: string): void {
    this.annonceFilterValue = value || '';
    this.selectedAnnonceId = value ? Number(value) : null;
    this.refreshAppliedFilters();
    this.reloadFromFirstPage();
  }

  onSourceFilterChange(value: string): void {
    this.sourceInput$.next(value ?? '');
  }

  private cancelPendingSource(): void {
    this.cancelSource$.next();
  }

  resetAdvancedFilters(): void {
    this.cancelPendingSource();
    this.annonceFilterValue = '';
    this.selectedAnnonceId = null;
    this.sourceFilter = '';
    this.refreshAppliedFilters();
    this.reloadFromFirstPage();
  }

  private reloadFromFirstPage(): void {
    this.currentPage = 0;
    this.loadDossiers();
  }

  /** Puces « filtres actifs » sous la barre (annonce, source). */
  private refreshAppliedFilters(): void {
    const chips: AppliedFilter[] = [];
    if (this.selectedAnnonceId) {
      const label = this.annonceOptions.find(o => o.value === String(this.selectedAnnonceId))?.label || `#${this.selectedAnnonceId}`;
      chips.push({ key: 'selectedAnnonceId', label: 'Annonce', value: String(this.selectedAnnonceId), displayValue: label });
    }
    if (this.sourceFilter.trim()) {
      chips.push({ key: 'sourceFilter', label: 'Source', value: this.sourceFilter.trim(), displayValue: this.sourceFilter.trim() });
    }
    this.appliedFilters = chips;
  }

  createDossier(): void {
    const dialogRef = this.dsDialogService.open<any>(DossierCreateDialogComponent, { width: '600px' });
    dialogRef.closed.subscribe(result => {
      if (result?.openExisting) {
        this.goToDossier(result.id);
      } else if (result) {
        this.toastService.success('Dossier créé avec succès');
        this.loadDossiers();
      }
    });
  }

  onMobileAction(event: DossierAction): void {
    const actions: MobileAction[] = [
      { icon: 'eye', label: 'Voir le dossier', action: 'view', color: 'primary' },
      { icon: 'phone', label: 'Appeler le prospect', action: 'call' },
      { icon: 'refresh', label: 'Archiver le dossier', action: 'archive', color: 'warn' },
      { icon: 'trash', label: 'Supprimer définitivement', action: 'delete', color: 'warn', divider: true }
    ];

    const dialogRef = this.dsDialogService.open<string>(MobileActionSheetComponent, {
      panelClass: 'ds-dialog-panel--bottom-sheet',
      data: {
        title: event.dossier.leadName || 'Dossier',
        subtitle: event.dossier.status,
        actions
      }
    });

    dialogRef.closed.subscribe(action => {
      if (!action) return;
      
      switch (action) {
        case 'view': this.router.navigate(['/dossiers', event.dossier.id]); break;
        case 'call': this.toastService.info(`Appel de ${event.dossier.leadName}...`); break;
        case 'archive': this.archiveDossier(event.dossier); break;
        case 'delete': this.confirmDeleteDossier(event.dossier); break;
      }
    });
  }

  archiveDossier(dossier: DossierResponse): void {
    this.dossierApiService.patchStatus(dossier.id, DossierStatus.LOST).subscribe({
      next: () => {
        this.toastService.success(`${dossier.leadName || 'Dossier'} archivé`);
        this.loadDossiers();
      },
      error: () => this.toastService.error('Erreur lors de l\'archivage')
    });
  }

  confirmDeleteDossier(dossier: DossierResponse): void {
    const dialogRef = this.dsDialogService.open<boolean>(ConfirmDeleteDialogComponent, {
      data: { 
        title: 'Supprimer le dossier', 
        message: `Voulez-vous vraiment supprimer le dossier de ${dossier.leadName || 'ce prospect'} ?` 
      }
    });

    dialogRef.closed.subscribe(confirmed => {
      if (confirmed) {
        this.dossierApiService.delete(dossier.id).subscribe({
          next: () => {
            this.toastService.success('Dossier supprimé');
            this.loadDossiers();
          },
          error: (err) => {
            this.toastService.error(err.error?.message || 'Erreur lors de la suppression');
          }
        });
      }
    });
  }

  openImportDialog(): void {
    const dialogRef = this.dsDialogService.open(LeadImportDialogComponent, { width: '700px' });
    dialogRef.closed.subscribe(success => { if (success) this.loadDossiers(); });
  }

  openExportDialog(): void {
    this.dsDialogService.open(LeadExportDialogComponent, { width: '800px' });
  }

  goToDossier(id: number): void {
    this.router.navigate(['/dossiers', id]);
  }

  onDsTableRowClick(row: any): void {
    this.goToDossier(row.id);
  }

  onDsTableRowAction(event: { action: string; row: any }): void {
    if (event.action === 'view') this.goToDossier(event.row.id);
    if (event.action === 'delete') this.confirmDeleteDossier(event.row);
  }

  trackByDossierId(index: number, d: DossierResponse): number { return d.id; }

  previousPage(): void { if (this.currentPage > 0) { this.currentPage--; this.loadDossiers(); } }
  nextPage(): void { if (this.page && !this.page.last) { this.currentPage++; this.loadDossiers(); } }

  removeFilter(filter: AppliedFilter): void {
    this.appliedFilters = this.appliedFilters.filter(f => f.key !== filter.key);
    switch (filter.key) {
      case 'selectedStatus': this.selectedStatus = ''; break;
      case 'phoneFilter': this.phoneFilter = ''; break;
      case 'sourceFilter': this.cancelPendingSource(); this.sourceFilter = ''; break;
      case 'selectedAnnonceId': this.selectedAnnonceId = null; this.annonceFilterValue = ''; break;
    }
    this.loadDossiers();
  }
  clearFilters(): void {
    this.cancelPendingSource();
    this.appliedFilters = [];
    this.selectedStatus = '';
    this.phoneFilter = '';
    this.sourceFilter = '';
    this.selectedAnnonceId = null;
    this.annonceFilterValue = '';
    this.loadDossiers();
  }

  private setupAnnonceAutocomplete(): void {
    this.filteredAnnonces = this.annonceSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const term = typeof value === 'string' ? value : (value?.title || '');
        return this.annonceApiService.list({ q: term, size: 20 }).pipe(map(page => page.content));
      })
    );
  }
}
