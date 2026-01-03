import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DashboardKpiService } from './dashboard-kpi.service';

describe('DashboardKpiService', () => {
  let service: DashboardKpiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(DashboardKpiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
