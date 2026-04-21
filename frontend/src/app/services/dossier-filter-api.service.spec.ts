import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DossierFilterApiService } from './dossier-filter-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DossierFilterApiService', () => {
  let service: DossierFilterApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(DossierFilterApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
