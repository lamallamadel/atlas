import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportingApiService } from './reporting-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ReportingApiService', () => {
  let service: ReportingApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(ReportingApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
