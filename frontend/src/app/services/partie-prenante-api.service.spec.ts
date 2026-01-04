import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PartiePrenanteApiService } from './partie-prenante-api.service';

describe('PartiePrenanteApiService', () => {
  let service: PartiePrenanteApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PartiePrenanteApiService]
    });
    service = TestBed.inject(PartiePrenanteApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET with dossierId query param', () => {
    const mockResponse: any[] = [];

    service.list(123).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/parties-prenantes' &&
      request.params.get('dossierId') === '123'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call GET for getById endpoint', () => {
    const mockResponse: any = { id: 1, dossierId: 123, role: 'BUYER' };

    service.getById(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/parties-prenantes/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call POST for create endpoint', () => {
    const createRequest: any = {
      dossierId: 123,
      role: 'BUYER',
      firstName: 'John',
      lastName: 'Doe'
    };
    const mockResponse: any = { id: 1, ...createRequest };

    service.create(createRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/parties-prenantes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockResponse);
  });

  it('should call PUT for update endpoint', () => {
    const updateRequest: any = {
      role: 'SELLER',
      firstName: 'Jane',
      lastName: 'Smith'
    };
    const mockResponse: any = { id: 1, ...updateRequest };

    service.update(1, updateRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/parties-prenantes/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(mockResponse);
  });

  it('should call DELETE for delete endpoint', () => {
    service.delete(1).subscribe();

    const req = httpMock.expectOne('/api/v1/parties-prenantes/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
