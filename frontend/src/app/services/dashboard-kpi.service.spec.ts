import { TestBed } from '@angular/core/testing';

import { DashboardKpiService } from './dashboard-kpi.service';

describe('DashboardKpiService', () => {
  let service: DashboardKpiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardKpiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
