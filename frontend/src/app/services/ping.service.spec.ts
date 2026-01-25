import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PingService, PongResponse } from './ping.service';

describe('PingService', () => {
  let service: PingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PingService]
    });
    service = TestBed.inject(PingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should ping the API', () => {
    const mockResponse: PongResponse = { message: 'pong' };

    service.ping().subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.message).toBe('pong');
    });

    const req = httpMock.expectOne('/api/v1/ping');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle ping error', () => {
    const errorMessage = 'Server error';

    service.ping().subscribe(
      () => fail('should have failed with server error'),
      (error) => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpMock.expectOne('/api/v1/ping');
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
  });
});
