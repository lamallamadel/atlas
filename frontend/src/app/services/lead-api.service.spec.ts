import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LeadApiService } from './lead-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('LeadApiService', () => {
  let service: LeadApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [LeadApiService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(LeadApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
