import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';

import { AnnoncesComponent } from './annonces.component';
import {
  AnnonceApiService,
  AnnonceStatus} from '../../services/annonce-api.service';
import { FilterPresetService } from '../../services/filter-preset.service';


@Component({
  selector: 'app-generic-table',
  template: '',
  imports: [
    FormsModule,
    RouterTestingModule]})
class GenericTableStubComponent {
  readonly columns = input<any>();
  readonly data = input<any>();
  readonly actions = input<any>();
  readonly showPagination = input(false);
  readonly enableSort = input(false);
  readonly enableRowSelection = input(false);
  readonly enableExport = input(false);
  readonly showTableHeader = input(false);
  readonly rowAction = output<any>();
  readonly exportRequest = output<any>();
}

@Component({
  selector: 'app-empty-state',
  template: '',
  imports: [
    FormsModule,
    RouterTestingModule]})
class EmptyStateStubComponent {
  readonly message = input('');
  readonly subtext = input('');
  readonly primaryAction = input<any>();
  readonly secondaryAction = input<any>();
  readonly context = input<any>();
  readonly isNewUser = input(false);
}

@Component({
  selector: 'app-loading-skeleton',
  template: '',
  imports: [
    FormsModule,
    RouterTestingModule]})
class LoadingSkeletonStubComponent {
  readonly variant = input('');
  readonly rows = input(0);
  readonly columns = input(0);
}

describe('AnnoncesComponent', () => {
  let component: AnnoncesComponent;
  let fixture: ComponentFixture<AnnoncesComponent>;
  let annonceApiService: AngularVitestPartialMock<AnnonceApiService>;
  let filterPresetService: AngularVitestPartialMock<FilterPresetService>;
  let breakpointObserver: AngularVitestPartialMock<BreakpointObserver>;

  const emptyPage = {
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

  beforeEach(async () => {
    const annonceApiServiceSpy = {
      list: vi.fn().mockReturnValue(of(emptyPage)),
      getDistinctCities: vi.fn().mockReturnValue(of([])),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn()};

    const filterPresetServiceSpy = {
      getPresets: vi.fn().mockReturnValue([]),
      savePreset: vi.fn(),
      deletePreset: vi.fn(),
      getPresetsLocally: vi.fn().mockReturnValue([]),
      savePresetLocally: vi.fn(),
      deletePresetLocally: vi.fn()};

    const breakpointObserverSpy = {
      observe: vi.fn().mockReturnValue(of({ matches: false, breakpoints: {} }))};

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        RouterTestingModule,
        NoopAnimationsModule,
        AnnoncesComponent,
        GenericTableStubComponent,
        EmptyStateStubComponent,
        LoadingSkeletonStubComponent],
      providers: [
        { provide: AnnonceApiService, useValue: annonceApiServiceSpy },
        { provide: FilterPresetService, useValue: filterPresetServiceSpy },
        { provide: BreakpointObserver, useValue: breakpointObserverSpy }]}).compileComponents();

    annonceApiService = TestBed.inject(
      AnnonceApiService
    ) as AngularVitestPartialMock<AnnonceApiService>;
    filterPresetService = TestBed.inject(
      FilterPresetService
    ) as AngularVitestPartialMock<FilterPresetService>;
    breakpointObserver = TestBed.inject(
      BreakpointObserver
    ) as AngularVitestPartialMock<BreakpointObserver>;

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
          updatedBy: 'user1'}],
      totalElements: 1,
      numberOfElements: 1,
      empty: false};

    (annonceApiService.list as ReturnType<typeof vi.fn>).mockReturnValue(of(mockPage));

    fixture.detectChanges(); // triggers ngOnInit

    expect(annonceApiService.list).toHaveBeenCalled();
    const listParams = (annonceApiService.list as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0] as { page: number; size: number };
    expect(listParams.page).toBe(0);
    expect(listParams.size).toBe(10);
    expect(component.annonces.length).toBe(1);
    expect(component.annonces[0].title).toBe('Test Annonce');
  });

  it('should render component', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should remove filter when chip is removed', () => {
    component.appliedFilters = [{ key: 'selectedStatus', label: 'Publié', value: AnnonceStatus.PUBLISHED }];
    const filter = component.appliedFilters[0];
    component.removeFilter(filter);

    expect(component.selectedStatus).toBe('');
  });
});
