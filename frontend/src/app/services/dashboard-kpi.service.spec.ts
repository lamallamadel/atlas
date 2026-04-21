import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardKpiService } from './dashboard-kpi.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DashboardKpiService', () => {
  let service: DashboardKpiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(DashboardKpiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
