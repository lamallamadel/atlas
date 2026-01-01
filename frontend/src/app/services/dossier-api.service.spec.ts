import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DossierApiService, DossierStatus, DossierCreateRequest } from './dossier-api.service';

describe('DossierApiService', () => {
  let service: DossierApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DossierApiService]
    });
    service = TestBed.inject(DossierApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET for list endpoint', () => {
    const mockPage = {
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

    const req = httpMock.expectOne('/api/v1/dossiers');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for list endpoint with params', () => {
    const mockPage = {
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

    service.list({ status: DossierStatus.NEW, leadPhone: '123456', annonceId: 1, page: 1, size: 20 }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request => 
      request.url === '/api/v1/dossiers' && 
      request.params.get('status') === 'NEW' &&
      request.params.get('leadPhone') === '123456' &&
      request.params.get('annonceId') === '1' &&
      request.params.get('page') === '1' &&
      request.params.get('size') === '20'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for getById endpoint', () => {
    const mockDossier = {
      id: 1,
      orgId: 'org1',
      annonceId: 1,
      leadPhone: '123456789',
      leadName: 'John Doe',
      leadSource: 'web',
      status: DossierStatus.NEW,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user1',
      updatedBy: 'user1'
    };

    service.getById(1).subscribe(response => {
      expect(response).toEqual(mockDossier);
    });

    const req = httpMock.expectOne('/api/v1/dossiers/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockDossier);
  });

  it('should call POST for create endpoint', () => {
    const createRequest: DossierCreateRequest = {
      orgId: 'org1',
      annonceId: 1,
      leadPhone: '123456789',
      leadName: 'John Doe',
      leadSource: 'web'
    };

    const mockResponse = {
      id: 1,
      ...createRequest,
      status: DossierStatus.NEW,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user1',
      updatedBy: 'user1'
    };

    service.create(createRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/dossiers');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockResponse);
  });

  it('should call PATCH for patchStatus endpoint', () => {
    const mockResponse = {
      id: 1,
      orgId: 'org1',
      status: DossierStatus.QUALIFIED,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T01:00:00Z',
      createdBy: 'user1',
      updatedBy: 'user1'
    };

    service.patchStatus(1, DossierStatus.QUALIFIED).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/dossiers/1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: DossierStatus.QUALIFIED });
    req.flush(mockResponse);
  });
});
