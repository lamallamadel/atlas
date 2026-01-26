import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DossierFilterApiService } from './dossier-filter-api.service';

describe('DossierFilterApiService', () => {
  let service: DossierFilterApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(DossierFilterApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
