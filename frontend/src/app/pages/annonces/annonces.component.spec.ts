import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AnnoncesComponent } from './annonces.component';
import { AnnonceApiService, AnnonceStatus } from '../../services/annonce-api.service';

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

describe('AnnoncesComponent', () => {
  let component: AnnoncesComponent;
  let fixture: ComponentFixture<AnnoncesComponent>;
  let annonceApiService: jasmine.SpyObj<AnnonceApiService>;

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

    // Default safe stubs for ngOnInit() calls.
    annonceApiServiceSpy.getDistinctCities.and.returnValue(of([]));
    annonceApiServiceSpy.list.and.returnValue(of(emptyPage));

    await TestBed.configureTestingModule({
      declarations: [AnnoncesComponent, GenericTableStubComponent, EmptyStateStubComponent],
      imports: [FormsModule, RouterTestingModule, NoopAnimationsModule],
      providers: [{ provide: AnnonceApiService, useValue: annonceApiServiceSpy }]
    }).compileComponents();

    annonceApiService = TestBed.inject(AnnonceApiService) as jasmine.SpyObj<AnnonceApiService>;
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
});
