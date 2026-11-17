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
import { of } from 'rxjs';
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
});
