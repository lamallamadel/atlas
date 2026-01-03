// FE/src/app/pages/dossiers/dossiers.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { DossiersComponent } from './dossiers.component';
import { GenericTableComponent } from '../../components/generic-table.component';
import { DossierApiService, DossierStatus } from '../../services/dossier-api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
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

  beforeAll(() => {
    registerLocaleData(localeFr);
  });


  beforeEach(async () => {
    const dossierApiServiceSpy = jasmine.createSpyObj('DossierApiService', ['list', 'getById', 'create', 'patchStatus']);

    await TestBed.configureTestingModule({
      declarations: [DossiersComponent, GenericTableComponent],
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
        MatChipsModule,
        NoopAnimationsModule
      ],
      providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }, { provide: DossierApiService, useValue: dossierApiServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

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
