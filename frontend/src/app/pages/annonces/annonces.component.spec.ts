import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { AnnoncesComponent } from './annonces.component';
import { GenericTableComponent } from '../../components/generic-table.component';
import { AnnonceApiService, AnnonceStatus } from '../../services/annonce-api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('AnnoncesComponent', () => {
  let component: AnnoncesComponent;
  let fixture: ComponentFixture<AnnoncesComponent>;
  let annonceApiService: jasmine.SpyObj<AnnonceApiService>;

  beforeEach(async () => {
    const annonceApiServiceSpy = jasmine.createSpyObj('AnnonceApiService', ['list', 'getById', 'create', 'update']);

    await TestBed.configureTestingModule({
      declarations: [AnnoncesComponent, GenericTableComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatTooltipModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AnnonceApiService, useValue: annonceApiServiceSpy }
      ]
    })
      .compileComponents();

    annonceApiService = TestBed.inject(AnnonceApiService) as jasmine.SpyObj<AnnonceApiService>;
    fixture = TestBed.createComponent(AnnoncesComponent);
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

    annonceApiService.list.and.returnValue(of(mockPage));

    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should call service on init', () => {
    const mockPage = {
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

    annonceApiService.list.and.returnValue(of(mockPage));

    fixture.detectChanges();

    expect(annonceApiService.list).toHaveBeenCalled();
    expect(component.annonces.length).toBe(1);
    expect(component.annonces[0].title).toBe('Test Annonce');
  });
});
