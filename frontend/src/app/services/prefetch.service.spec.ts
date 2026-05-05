import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PrefetchService } from './prefetch.service';
import { DossierApiService } from './dossier-api.service';
import { AnnonceApiService } from './annonce-api.service';

describe('PrefetchService', () => {
  let service: PrefetchService;
  let mockRouter: AngularVitestPartialMock<Router>;
  let mockDossierApiService: AngularVitestPartialMock<DossierApiService>;
  let mockAnnonceApiService: AngularVitestPartialMock<AnnonceApiService>;

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn().mockName('Router.navigate'),
      events: of(),
    };
    mockDossierApiService = {
      list: vi.fn().mockName('DossierApiService.list'),
    };
    mockAnnonceApiService = {
      list: vi.fn().mockName('AnnonceApiService.list'),
    };

    TestBed.configureTestingModule({
      providers: [
        PrefetchService,
        { provide: Router, useValue: mockRouter },
        { provide: DossierApiService, useValue: mockDossierApiService },
        { provide: AnnonceApiService, useValue: mockAnnonceApiService },
      ],
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
