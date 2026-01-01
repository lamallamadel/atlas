import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { DossiersComponent } from './dossiers.component';
import { DossierApiService, DossierStatus } from '../../services/dossier-api.service';
import { of } from 'rxjs';

describe('DossiersComponent', () => {
  let component: DossiersComponent;
  let fixture: ComponentFixture<DossiersComponent>;
  let dossierApiService: jasmine.SpyObj<DossierApiService>;

  beforeEach(async () => {
    const dossierApiServiceSpy = jasmine.createSpyObj('DossierApiService', ['list', 'getById', 'create', 'patchStatus']);

    await TestBed.configureTestingModule({
      declarations: [ DossiersComponent ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        { provide: DossierApiService, useValue: dossierApiServiceSpy }
      ]
    })
    .compileComponents();

    dossierApiService = TestBed.inject(DossierApiService) as jasmine.SpyObj<DossierApiService>;
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
});
