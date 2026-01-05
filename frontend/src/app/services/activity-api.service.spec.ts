import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivityApiService } from './activity-api.service';

describe('ActivityApiService', () => {
  let service: ActivityApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ActivityApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
