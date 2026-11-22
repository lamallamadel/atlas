// FE/src/app/pages/dossiers/dossiers.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DossiersComponent } from './dossiers.component';
import {
  DossierApiService,
  DossierStatus} from '../../services/dossier-api.service';
import { AnnonceApiService } from '../../services/annonce-api.service';
import { FilterPresetService } from '../../services/filter-preset.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  provideHttpClient,
  withInterceptorsFromDi} from '@angular/common/http';

/** Espions Jasmine sans `@types/jasmine` global (évite le conflit Vitest / Karma sur `expect`). */
type KarmaSpyFn = ((...args: unknown[]) => unknown) & {
  and: { returnValue(v: unknown): KarmaSpyFn };
};

function karmaSpy(name: string): KarmaSpyFn {
  const base = vi.fn().mockName(name);
  const fn = base as unknown as KarmaSpyFn;
  fn.and = {
    returnValue(v: unknown): KarmaSpyFn {
      base.mockReturnValue(v);
      return fn;
    }};
  return fn;
}

describe('DossiersComponent', () => {
  let component: DossiersComponent;
  let fixture: ComponentFixture<DossiersComponent>;
  let dossierApiService: AngularVitestPartialMock<DossierApiService>;
  let annonceApiService: AngularVitestPartialMock<AnnonceApiService>;
  let filterPresetService: AngularVitestPartialMock<FilterPresetService>;
  let breakpointObserver: AngularVitestPartialMock<BreakpointObserver>;

  beforeAll(() => {
    registerLocaleData(localeFr);
  });

  beforeEach(async () => {
    const dossierApiServiceSpy = {
      list: karmaSpy('DossierApiService.list'),
      getById: karmaSpy('DossierApiService.getById'),
      create: karmaSpy('DossierApiService.create'),
      patchStatus: karmaSpy('DossierApiService.patchStatus')};
    const annonceApiServiceSpy = {
      list: karmaSpy('AnnonceApiService.list'),
      getById: karmaSpy('AnnonceApiService.getById')};
    const filterPresetServiceSpy = {
      getPresets: karmaSpy('FilterPresetService.getPresets'),
      savePreset: karmaSpy('FilterPresetService.savePreset'),
      deletePreset: karmaSpy('FilterPresetService.deletePreset'),
      getPresetsLocally: karmaSpy('FilterPresetService.getPresetsLocally'),
      savePresetLocally: karmaSpy('FilterPresetService.savePresetLocally'),
      deletePresetLocally: karmaSpy('FilterPresetService.deletePresetLocally')};
    const breakpointObserverSpy = {
      observe: karmaSpy('BreakpointObserver.observe')};

    breakpointObserverSpy.observe.and.returnValue(
      of({ matches: false, breakpoints: {} })
    );
    filterPresetServiceSpy.getPresets.and.returnValue([]);
    filterPresetServiceSpy.getPresetsLocally.and.returnValue([]);
    annonceApiServiceSpy.list.and.returnValue(
      of({
        content: [],
        pageable: {
          sort: { empty: true, sorted: false, unsorted: true },
          offset: 0,
          pageNumber: 0,
          pageSize: 10,
          paged: true,
          unpaged: false},
        last: true,
        totalPages: 0,
        totalElements: 0,
        size: 10,
        number: 0,
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: 0,
        empty: true})
    );

    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        DossiersComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'fr-FR' },
        { provide: DossierApiService, useValue: dossierApiServiceSpy },
        { provide: AnnonceApiService, useValue: annonceApiServiceSpy },
        { provide: FilterPresetService, useValue: filterPresetServiceSpy },
        { provide: BreakpointObserver, useValue: breakpointObserverSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()]}).compileComponents();

    dossierApiService = TestBed.inject(
      DossierApiService
    ) as AngularVitestPartialMock<DossierApiService>;
    annonceApiService = TestBed.inject(
      AnnonceApiService
    ) as AngularVitestPartialMock<AnnonceApiService>;
    filterPresetService = TestBed.inject(
      FilterPresetService
    ) as AngularVitestPartialMock<FilterPresetService>;
    breakpointObserver = TestBed.inject(
      BreakpointObserver
    ) as AngularVitestPartialMock<BreakpointObserver>;

    fixture = TestBed.createComponent(DossiersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    const mockPage = {
      content: [],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false},
      last: true,
      totalPages: 1,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true};

    dossierApiService.list.and.returnValue(of(mockPage));
    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should call service on init', () => {
    const mockPage = {
      content: [
        {
          id: 1,
          orgId: 'org1',
          annonceId: 1,
          leadPhone: '123456789',
          leadName: 'John Doe',
          leadSource: 'web',
          status: DossierStatus.NEW,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user1',
          updatedBy: 'user1'}],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false},
      last: true,
      totalPages: 1,
      totalElements: 1,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 1,
      empty: false};

    dossierApiService.list.and.returnValue(of(mockPage));
    fixture.detectChanges();

    expect(dossierApiService.list).toHaveBeenCalled();
    expect(component.dossiers.length).toBe(1);
    expect(component.dossiers[0].leadName).toBe('John Doe');
  });

  it('should remove filter when chip is removed', () => {
    const mockPage = {
      content: [],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false},
      last: true,
      totalPages: 0,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true};

    dossierApiService.list.and.returnValue(of(mockPage));

    component.selectedStatus = DossierStatus.QUALIFIED;
    const filter: any = { key: 'selectedStatus', label: 'Qualifié', value: DossierStatus.QUALIFIED };
    component.appliedFilters = [filter];
    component.removeFilter(filter);

    expect(component.selectedStatus).toBe('');
  });
  describe('filtres avancés et recherche', () => {
    const empty = { content: [], last: true, totalPages: 0, totalElements: 0, size: 10, number: 0, first: true, numberOfElements: 0, empty: true } as any;

    beforeEach(() => {
      dossierApiService.list.and.returnValue(of(empty));
      fixture.detectChanges();
      (dossierApiService.list as any).mockClear();
    });

    it('la recherche part au serveur 300 ms après la frappe, depuis la première page', async () => {
      component.currentPage = 3;
      component.onSearchChange('sal');
      component.onSearchChange('salma');
      expect(dossierApiService.list).not.toHaveBeenCalled();
      await new Promise(r => setTimeout(r, 350));
      expect(dossierApiService.list).toHaveBeenCalledTimes(1);
      expect((dossierApiService.list as any).mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ q: 'salma', page: 0 }));
    });

    it('filtre par annonce : puce affichée et retirable', () => {
      component.annonceOptions = [{ value: '', label: 'Toutes les annonces' }, { value: '7', label: 'Villa — Tanger' }];
      component.onAnnonceFilterChange('7');
      expect((dossierApiService.list as any).mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ annonceId: 7 }));
      expect(component.appliedFilters).toEqual([expect.objectContaining({ key: 'selectedAnnonceId', displayValue: 'Villa — Tanger' })]);

      component.removeFilter(component.appliedFilters[0]);
      expect(component.selectedAnnonceId).toBeNull();
      expect(component.annonceFilterValue).toBe('');
    });

    it('le bouton Filtres ouvre le panneau et charge les annonces une fois', () => {
      expect(component.filterPanelExpanded).toBe(false);
      component.openAdvancedFilters();
      expect(component.filterPanelExpanded).toBe(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="dos-advanced-filters"]')).toBeTruthy();
    });

    it("une réponse plus ancienne n'écrase pas la plus récente", () => {
      const older = new Subject<any>();
      const newer = new Subject<any>();
      (dossierApiService.list as any).mockReturnValueOnce(older).mockReturnValueOnce(newer);
      component.loadDossiers();
      component.loadDossiers();
      newer.next({ ...empty, content: [{ id: 2, leadName: 'salma' }] });
      older.next({ ...empty, content: [{ id: 1, leadName: 'sal' }] });
      expect(component.dossiers.map(d => d.id)).toEqual([2]);
    });

    it('Réinitialiser annule une source encore en attente', async () => {
      component.onSourceFilterChange('whats');
      component.resetAdvancedFilters();
      await new Promise(r => setTimeout(r, 350));
      expect(component.sourceFilter).toBe('');
      expect(component.appliedFilters).toEqual([]);
    });
  });

  it('un lien ?source= affiche la puce Source', () => {
    TestBed.inject(ActivatedRoute).queryParams = of({ source: 'WhatsApp' }) as any;
    dossierApiService.list.and.returnValue(of({ content: [], last: true } as any));
    component.ngOnInit();
    expect(component.appliedFilters).toEqual([expect.objectContaining({ key: 'sourceFilter', value: 'WhatsApp' })]);
  });
});
