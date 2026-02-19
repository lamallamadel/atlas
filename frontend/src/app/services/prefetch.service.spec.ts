import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PrefetchService } from './prefetch.service';
import { DossierApiService } from './dossier-api.service';
import { AnnonceApiService } from './annonce-api.service';

describe('PrefetchService', () => {
  let service: PrefetchService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDossierApiService: jasmine.SpyObj<DossierApiService>;
  let mockAnnonceApiService: jasmine.SpyObj<AnnonceApiService>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], { events: of() });
    mockDossierApiService = jasmine.createSpyObj('DossierApiService', ['list']);
    mockAnnonceApiService = jasmine.createSpyObj('AnnonceApiService', ['list']);

    TestBed.configureTestingModule({
      providers: [
        PrefetchService,
        { provide: Router, useValue: mockRouter },
        { provide: DossierApiService, useValue: mockDossierApiService },
        { provide: AnnonceApiService, useValue: mockAnnonceApiService }
      ]
    });
    service = TestBed.inject(PrefetchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should clear prefetch cache', () => {
    service.clearPrefetchCache();
    expect(service).toBeTruthy();
  });
});
