import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { of } from 'rxjs';

import { AnnoncesComponent } from './annonces.component';
import { AnnonceApiService, AnnonceStatus } from '../../services/annonce-api.service';
import { FilterPresetService } from '../../services/filter-preset.service';

@Component({ selector: 'app-generic-table', template: '' })
class GenericTableStubComponent {
  @Input() columns: any;
  @Input() data: any;
  @Input() actions: any;
  @Input() showPagination = false;
  @Input() enableSort = false;
  @Output() rowAction = new EventEmitter<any>();
}

@Component({ selector: 'app-empty-state', template: '' })
class EmptyStateStubComponent {
  @Input() message = '';
  @Input() subtext = '';
  @Input() primaryAction: any;
  @Input() secondaryAction: any;
}

@Component({ selector: 'app-loading-skeleton', template: '' })
class LoadingSkeletonStubComponent {
  @Input() variant = '';
  @Input() rows = 0;
  @Input() columns = 0;
}

describe('AnnoncesComponent', () => {
  let component: AnnoncesComponent;
  let fixture: ComponentFixture<AnnoncesComponent>;
  let annonceApiService: jasmine.SpyObj<AnnonceApiService>;
  let filterPresetService: jasmine.SpyObj<FilterPresetService>;
  let bottomSheet: jasmine.SpyObj<MatBottomSheet>;
  let breakpointObserver: jasmine.SpyObj<BreakpointObserver>;

  const emptyPage = {
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

  beforeEach(async () => {
    const annonceApiServiceSpy = jasmine.createSpyObj('AnnonceApiService', [
      'list',
      'getDistinctCities',
      'getById',
      'create',
      'update'
    ]);

    const filterPresetServiceSpy = jasmine.createSpyObj('FilterPresetService', [
      'getPresets',
      'savePreset',
      'deletePreset'
    ]);

    const bottomSheetSpy = jasmine.createSpyObj('MatBottomSheet', ['open']);
    
    const breakpointObserverSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);
    breakpointObserverSpy.observe.and.returnValue(of({ matches: false, breakpoints: {} }));

    // Default safe stubs for ngOnInit() calls.
    annonceApiServiceSpy.getDistinctCities.and.returnValue(of([]));
    annonceApiServiceSpy.list.and.returnValue(of(emptyPage));
    filterPresetServiceSpy.getPresets.and.returnValue([]);

    await TestBed.configureTestingModule({
      declarations: [
        AnnoncesComponent, 
        GenericTableStubComponent, 
        EmptyStateStubComponent,
        LoadingSkeletonStubComponent
      ],
      imports: [
        FormsModule, 
        RouterTestingModule, 
        NoopAnimationsModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        MatChipsModule,
        MatMenuModule
      ],
      providers: [
        { provide: AnnonceApiService, useValue: annonceApiServiceSpy },
        { provide: FilterPresetService, useValue: filterPresetServiceSpy },
        { provide: MatBottomSheet, useValue: bottomSheetSpy },
        { provide: BreakpointObserver, useValue: breakpointObserverSpy }
      ]
    }).compileComponents();

    annonceApiService = TestBed.inject(AnnonceApiService) as jasmine.SpyObj<AnnonceApiService>;
    filterPresetService = TestBed.inject(FilterPresetService) as jasmine.SpyObj<FilterPresetService>;
    bottomSheet = TestBed.inject(MatBottomSheet) as jasmine.SpyObj<MatBottomSheet>;
    breakpointObserver = TestBed.inject(BreakpointObserver) as jasmine.SpyObj<BreakpointObserver>;
    
    fixture = TestBed.createComponent(AnnoncesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service on init and populate annonces', () => {
    const mockPage = {
      ...emptyPage,
      content: [
        {
          id: 1,
          orgId: 'org1',
          title: 'Test Annonce',
          status: AnnonceStatus.PUBLISHED,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user1',
          updatedBy: 'user1'
        }
      ],
      totalElements: 1,
      numberOfElements: 1,
      empty: false
    };

    annonceApiService.list.and.returnValue(of(mockPage));
    annonceApiService.getDistinctCities.and.returnValue(of(['Tanger']));

    fixture.detectChanges(); // triggers ngOnInit

    expect(annonceApiService.getDistinctCities).toHaveBeenCalled();
    expect(annonceApiService.list).toHaveBeenCalledWith(jasmine.objectContaining({ page: 0, size: 10 }));
    expect(component.annonces.length).toBe(1);
    expect(component.annonces[0].title).toBe('Test Annonce');
  });

  it('should render component', () => {
    annonceApiService.list.and.returnValue(of(emptyPage));
    annonceApiService.getDistinctCities.and.returnValue(of([]));

    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should update applied filters when filters change', () => {
    component.selectedStatus = AnnonceStatus.PUBLISHED;
    component.selectedCity = 'Paris';
    component.updateAppliedFilters();

    expect(component.appliedFilters.length).toBe(2);
    expect(component.appliedFilters[0].key).toBe('selectedStatus');
    expect(component.appliedFilters[1].key).toBe('selectedCity');
  });

  it('should remove filter when chip is removed', () => {
    component.selectedStatus = AnnonceStatus.PUBLISHED;
    component.selectedCity = 'Paris';
    component.updateAppliedFilters();

    const filter = component.appliedFilters[0];
    component.removeFilter(filter);

    expect(component.selectedStatus).toBe('');
  });
});
