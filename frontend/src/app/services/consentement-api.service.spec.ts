import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsentementApiService, ConsentementChannel, ConsentementStatus } from './consentement-api.service';

describe('ConsentementApiService', () => {
  let service: ConsentementApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConsentementApiService]
    });
    service = TestBed.inject(ConsentementApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET for list endpoint with dossierId', () => {
    const mockPage: any = {
      content: [],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false
      },
      last: true,
      totalPages: 1,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true
    };

    service.list({ dossierId: 123 }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/consentements' &&
      request.params.get('dossierId') === '123'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for list endpoint with channel filter', () => {
    const mockPage: any = {
      content: [],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false
      },
      last: true,
      totalPages: 1,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true
    };

    service.list({ channel: ConsentementChannel.EMAIL }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/consentements' &&
      request.params.get('channel') === 'EMAIL'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for list endpoint with status filter', () => {
    const mockPage: any = {
      content: [],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false
      },
      last: true,
      totalPages: 1,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true
    };

    service.list({ status: ConsentementStatus.GRANTED }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/consentements' &&
      request.params.get('status') === 'GRANTED'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for list endpoint with multiple filters', () => {
    const mockPage: any = {
      content: [],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
        paged: true,
        unpaged: false
      },
      last: true,
      totalPages: 1,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 0,
      empty: true
    };

    service.list({
      dossierId: 123,
      channel: ConsentementChannel.SMS,
      status: ConsentementStatus.DENIED,
      page: 1,
      size: 20,
      sort: 'updatedAt,desc'
    }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/consentements' &&
      request.params.get('dossierId') === '123' &&
      request.params.get('channel') === 'SMS' &&
      request.params.get('status') === 'DENIED' &&
      request.params.get('page') === '1' &&
      request.params.get('size') === '20' &&
      request.params.get('sort') === 'updatedAt,desc'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for getById endpoint', () => {
    const mockResponse: any = {
      id: 1,
      orgId: 'org1',
      dossierId: 123,
      channel: ConsentementChannel.EMAIL,
      status: ConsentementStatus.GRANTED,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    service.getById(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/consentements/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call POST for create endpoint', () => {
    const createRequest: any = {
      dossierId: 123,
      channel: ConsentementChannel.EMAIL,
      status: ConsentementStatus.GRANTED,
      meta: { user: 'admin' }
    };
    const mockResponse: any = {
      id: 1,
      orgId: 'org1',
      ...createRequest,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    service.create(createRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/consentements');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockResponse);
  });

  it('should call PUT for update endpoint', () => {
    const updateRequest: any = {
      channel: ConsentementChannel.SMS,
      status: ConsentementStatus.REVOKED,
      meta: { reason: 'User requested' }
    };
    const mockResponse: any = {
      id: 1,
      orgId: 'org1',
      dossierId: 123,
      ...updateRequest,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    };

    service.update(1, updateRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/consentements/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(mockResponse);
  });

  it('should call DELETE for delete endpoint', () => {
    service.delete(1).subscribe();

    const req = httpMock.expectOne('/api/v1/consentements/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
