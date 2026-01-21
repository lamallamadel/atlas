import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LeadApiService } from './lead-api.service';

describe('LeadApiService', () => {
  let service: LeadApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LeadApiService]
    });
    service = TestBed.inject(LeadApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
