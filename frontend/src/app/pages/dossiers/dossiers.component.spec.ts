import { MatSnackBar } from '@angular/material/snack-bar';
// FE/src/app/pages/dossiers/dossiers.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DossiersComponent } from './dossiers.component';
import { GenericTableComponent } from '../../components/generic-table.component';
import {
  DossierApiService,
  DossierStatus,
} from '../../services/dossier-api.service';
import { AnnonceApiService } from '../../services/annonce-api.service';
import { FilterPresetService } from '../../services/filter-preset.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import {} from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('DossiersComponent', () => {
  let component: DossiersComponent;
  let fixture: ComponentFixture<DossiersComponent>;
  let dossierApiService: AngularVitestPartialMock<DossierApiService>;
  let annonceApiService: AngularVitestPartialMock<AnnonceApiService>;
  let filterPresetService: AngularVitestPartialMock<FilterPresetService>;
  let bottomSheet: AngularVitestPartialMock<MatBottomSheet>;
  let breakpointObserver: AngularVitestPartialMock<BreakpointObserver>;

  beforeAll(() => {
    registerLocaleData(localeFr);
  });

  beforeEach(async () => {
    const dossierApiServiceSpy = {
      list: vi.fn().mockName('DossierApiService.list'),
      getById: vi.fn().mockName('DossierApiService.getById'),
      create: vi.fn().mockName('DossierApiService.create'),
      patchStatus: vi.fn().mockName('DossierApiService.patchStatus'),
    };
    const annonceApiServiceSpy = {
      list: vi.fn().mockName('AnnonceApiService.list'),
      getById: vi.fn().mockName('AnnonceApiService.getById'),
    };
    const filterPresetServiceSpy = {
      getPresets: vi.fn().mockName('FilterPresetService.getPresets'),
      savePreset: vi.fn().mockName('FilterPresetService.savePreset'),
      deletePreset: vi.fn().mockName('FilterPresetService.deletePreset'),
      getPresetsLocally: vi
        .fn()
        .mockName('FilterPresetService.getPresetsLocally'),
      savePresetLocally: vi
        .fn()
        .mockName('FilterPresetService.savePresetLocally'),
      deletePresetLocally: vi
        .fn()
        .mockName('FilterPresetService.deletePresetLocally'),
    };
    const bottomSheetSpy = {
      open: vi.fn().mockName('MatBottomSheet.open'),
    };
    const breakpointObserverSpy = {
      observe: vi.fn().mockName('BreakpointObserver.observe'),
    };

    breakpointObserverSpy.observe.mockReturnValue(
      of({ matches: false, breakpoints: {} })
    );
    filterPresetServiceSpy.getPresets.mockReturnValue([]);
    filterPresetServiceSpy.getPresetsLocally.mockReturnValue([]);
    annonceApiServiceSpy.list.mockReturnValue(
      of({
        content: [],
        pageable: {
          sort: { empty: true, sorted: false, unsorted: true },
          offset: 0,
          pageNumber: 0,
          pageSize: 10,
          paged: true,
          unpaged: false,
        },
        last: true,
        totalPages: 0,
        totalElements: 0,
        size: 10,
        number: 0,
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: 0,
        empty: true,
      })
    );

    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatTooltipModule,
        MatChipsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        MatExpansionModule,
        MatSelectModule,
        MatMenuModule,

        NoopAnimationsModule,
        DossiersComponent,
        GenericTableComponent,
      ],
      providers: [
        {
          provide: MatSnackBar,
          useValue: {
            open: () => ({
              onAction: () => of(null),
              afterDismissed: () => of(null),
            }),
            dismiss: () => {},
          },
        },
        { provide: LOCALE_ID, useValue: 'fr-FR' },
        { provide: DossierApiService, useValue: dossierApiServiceSpy },
        { provide: AnnonceApiService, useValue: annonceApiServiceSpy },
        { provide: FilterPresetService, useValue: filterPresetServiceSpy },
        { provide: MatBottomSheet, useValue: bottomSheetSpy },
        { provide: BreakpointObserver, useValue: breakpointObserverSpy },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn().mockName('MatDialog.open'),
          },
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    dossierApiService = TestBed.inject(
      DossierApiService
    ) as AngularVitestPartialMock<DossierApiService>;
    annonceApiService = TestBed.inject(
      AnnonceApiService
    ) as AngularVitestPartialMock<AnnonceApiService>;
    filterPresetService = TestBed.inject(
      FilterPresetService
    ) as AngularVitestPartialMock<FilterPresetService>;
    bottomSheet = TestBed.inject(
      MatBottomSheet
    ) as AngularVitestPartialMock<MatBottomSheet>;
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
        unpaged: false,
      },
      last: true,
      totalPages: 1,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true,
    };

    dossierApiService.list.mockReturnValue(of(mockPage));
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
          updatedBy: 'user1',
        },
      ],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false,
      },
      last: true,
      totalPages: 1,
      totalElements: 1,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 1,
      empty: false,
    };

    dossierApiService.list.mockReturnValue(of(mockPage));
    fixture.detectChanges();

    expect(dossierApiService.list).toHaveBeenCalled();
    expect(component.dossiers.length).toBe(1);
    expect(component.dossiers[0].leadName).toBe('John Doe');
  });

  it('should update applied filters when filters change', () => {
    component.selectedStatus = DossierStatus.QUALIFIED;
    component.phoneFilter = '+33612345678';
    component.updateAppliedFilters();

    expect(component.appliedFilters.length).toBe(2);
    expect(component.appliedFilters[0].key).toBe('selectedStatus');
    expect(component.appliedFilters[1].key).toBe('phoneFilter');
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
        unpaged: false,
      },
      last: true,
      totalPages: 0,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true,
    };

    dossierApiService.list.mockReturnValue(of(mockPage));

    component.selectedStatus = DossierStatus.QUALIFIED;
    component.phoneFilter = '+33612345678';
    component.updateAppliedFilters();

    const filter = component.appliedFilters[0];
    component.removeFilter(filter);

    expect(component.selectedStatus).toBe('');
  });
});
