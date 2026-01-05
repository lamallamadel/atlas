import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReportingApiService } from './reporting-api.service';

describe('ReportingApiService', () => {
  let service: ReportingApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ReportingApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
