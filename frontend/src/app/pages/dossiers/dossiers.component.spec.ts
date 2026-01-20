// FE/src/app/pages/dossiers/dossiers.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DossiersComponent } from './dossiers.component';
import { GenericTableComponent } from '../../components/generic-table.component';
import { DossierApiService, DossierStatus } from '../../services/dossier-api.service';
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
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

describe('DossiersComponent', () => {
  let component: DossiersComponent;
  let fixture: ComponentFixture<DossiersComponent>;
  let dossierApiService: jasmine.SpyObj<DossierApiService>;
  let annonceApiService: jasmine.SpyObj<AnnonceApiService>;
  let filterPresetService: jasmine.SpyObj<FilterPresetService>;
  let bottomSheet: jasmine.SpyObj<MatBottomSheet>;
  let breakpointObserver: jasmine.SpyObj<BreakpointObserver>;

  beforeAll(() => {
    registerLocaleData(localeFr);
  });

  beforeEach(async () => {
    const dossierApiServiceSpy = jasmine.createSpyObj('DossierApiService', ['list', 'getById', 'create', 'patchStatus']);
    const annonceApiServiceSpy = jasmine.createSpyObj('AnnonceApiService', ['list', 'getById']);
    const filterPresetServiceSpy = jasmine.createSpyObj('FilterPresetService', ['getPresets', 'savePreset', 'deletePreset']);
    const bottomSheetSpy = jasmine.createSpyObj('MatBottomSheet', ['open']);
    const breakpointObserverSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);

    breakpointObserverSpy.observe.and.returnValue(of({ matches: false, breakpoints: {} }));
    filterPresetServiceSpy.getPresets.and.returnValue([]);
    annonceApiServiceSpy.list.and.returnValue(of({
      content: [],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false
      },
      last: true,
      totalPages: 0,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true
    }));

    await TestBed.configureTestingModule({
      declarations: [DossiersComponent, GenericTableComponent],
      imports: [
        HttpClientTestingModule,
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
        NoopAnimationsModule
      ],
      providers: [
        { provide: LOCALE_ID, useValue: 'fr-FR' },
        { provide: DossierApiService, useValue: dossierApiServiceSpy },
        { provide: AnnonceApiService, useValue: annonceApiServiceSpy },
        { provide: FilterPresetService, useValue: filterPresetServiceSpy },
        { provide: MatBottomSheet, useValue: bottomSheetSpy },
        { provide: BreakpointObserver, useValue: breakpointObserverSpy },
        { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    dossierApiService = TestBed.inject(DossierApiService) as jasmine.SpyObj<DossierApiService>;
    annonceApiService = TestBed.inject(AnnonceApiService) as jasmine.SpyObj<AnnonceApiService>;
    filterPresetService = TestBed.inject(FilterPresetService) as jasmine.SpyObj<FilterPresetService>;
    bottomSheet = TestBed.inject(MatBottomSheet) as jasmine.SpyObj<MatBottomSheet>;
    breakpointObserver = TestBed.inject(BreakpointObserver) as jasmine.SpyObj<BreakpointObserver>;

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
        unpaged: false
      },
      last: true,
      totalPages: 1,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true
    };

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
          updatedBy: 'user1'
        }
      ],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false
      },
      last: true,
      totalPages: 1,
      totalElements: 1,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 1,
      empty: false
    };

    dossierApiService.list.and.returnValue(of(mockPage));
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
        unpaged: false
      },
      last: true,
      totalPages: 0,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true
    };

    dossierApiService.list.and.returnValue(of(mockPage));

    component.selectedStatus = DossierStatus.QUALIFIED;
    component.phoneFilter = '+33612345678';
    component.updateAppliedFilters();

    const filter = component.appliedFilters[0];
    component.removeFilter(filter);

    expect(component.selectedStatus).toBe('');
  });
});
