// FE/src/app/pages/dossiers/dossier-create.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { DossierCreateComponent } from './dossier-create.component';
import { DossierApiService } from '../../services/dossier-api.service';
import { AnnonceApiService } from '../../services/annonce-api.service';

describe('DossierCreateComponent', () => {
  let component: DossierCreateComponent;
  let fixture: ComponentFixture<DossierCreateComponent>;
  let dossierApiService: AngularVitestPartialMock<DossierApiService>;
  let annonceApiService: AngularVitestPartialMock<AnnonceApiService>;
  let router: AngularVitestPartialMock<Router>;

  beforeEach(async () => {
    dossierApiService = {
      create: vi.fn().mockName('DossierApiService.create'),
      checkDuplicates: vi.fn().mockName('DossierApiService.checkDuplicates'),
    };
    annonceApiService = {
      list: vi.fn().mockName('AnnonceApiService.list'),
    };
    router = {
      navigate: vi.fn().mockName('Router.navigate'),
    };

    annonceApiService.list.mockReturnValue(
      of({
        content: [],
        pageable: {
          sort: { empty: true, sorted: false, unsorted: true },
          offset: 0,
          pageNumber: 0,
          pageSize: 20,
          paged: true,
          unpaged: false,
        },
        last: true,
        totalPages: 1,
        totalElements: 0,
        size: 20,
        number: 0,
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: 0,
        empty: true,
      } as any)
    );

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, DossierCreateComponent],
      providers: [
        { provide: DossierApiService, useValue: dossierApiService },
        { provide: AnnonceApiService, useValue: annonceApiService },
        { provide: Router, useValue: router },
      ],
    })
      .overrideTemplate(DossierCreateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(DossierCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
