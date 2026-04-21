import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivityApiService } from './activity-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ActivityApiService', () => {
  let service: ActivityApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(ActivityApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
