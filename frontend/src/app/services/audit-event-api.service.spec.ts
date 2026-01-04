import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuditEventApiService, AuditAction, AuditEntityType } from './audit-event-api.service';

describe('AuditEventApiService', () => {
  let service: AuditEventApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditEventApiService]
    });
    service = TestBed.inject(AuditEventApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET for list endpoint without params', () => {
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

    service.list().subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne('/api/v1/audit-events');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for list endpoint with entityType filter', () => {
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

    service.list({ entityType: AuditEntityType.DOSSIER }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/audit-events' &&
      request.params.get('entityType') === 'DOSSIER'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for list endpoint with entityId filter', () => {
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

    service.list({ entityId: 123 }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/audit-events' &&
      request.params.get('entityId') === '123'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for list endpoint with action filter', () => {
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

    service.list({ action: AuditAction.CREATED }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/audit-events' &&
      request.params.get('action') === 'CREATED'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for list endpoint with userId filter', () => {
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

    service.list({ userId: 'user123' }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/audit-events' &&
      request.params.get('userId') === 'user123'
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
      entityType: AuditEntityType.MESSAGE,
      entityId: 456,
      action: AuditAction.UPDATED,
      userId: 'admin',
      page: 2,
      size: 25,
      sort: 'createdAt,desc'
    }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/audit-events' &&
      request.params.get('entityType') === 'MESSAGE' &&
      request.params.get('entityId') === '456' &&
      request.params.get('action') === 'UPDATED' &&
      request.params.get('userId') === 'admin' &&
      request.params.get('page') === '2' &&
      request.params.get('size') === '25' &&
      request.params.get('sort') === 'createdAt,desc'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for getById endpoint', () => {
    const mockResponse: any = {
      id: 1,
      orgId: 'org1',
      entityType: AuditEntityType.DOSSIER,
      entityId: 123,
      action: AuditAction.CREATED,
      userId: 'user1',
      diff: { status: { old: 'NEW', new: 'QUALIFIED' } },
      createdAt: '2024-01-01T00:00:00Z'
    };

    service.getById(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/audit-events/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call POST for create endpoint', () => {
    const createRequest: any = {
      entityType: AuditEntityType.DOSSIER,
      entityId: 123,
      action: AuditAction.UPDATED,
      userId: 'user1',
      diff: { status: { old: 'NEW', new: 'QUALIFIED' } }
    };
    const mockResponse: any = {
      id: 1,
      orgId: 'org1',
      ...createRequest,
      createdAt: '2024-01-01T00:00:00Z'
    };

    service.create(createRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/audit-events');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockResponse);
  });

  it('should call listByDossier with correct params', () => {
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

    service.listByDossier(123, { page: 0, size: 10 }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/audit-events' &&
      request.params.get('entityId') === '123' &&
      request.params.get('page') === '0' &&
      request.params.get('size') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });
});
