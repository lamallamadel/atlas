import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AnnonceApiService, AnnonceStatus, AnnonceCreateRequest, AnnonceUpdateRequest } from './annonce-api.service';

describe('AnnonceApiService', () => {
  let service: AnnonceApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AnnonceApiService]
    });
    service = TestBed.inject(AnnonceApiService);
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

    const req = httpMock.expectOne('/api/v1/annonces');
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

    service.list({ status: AnnonceStatus.PUBLISHED, q: 'test', page: 1, size: 20 }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request => 
      request.url === '/api/v1/annonces' && 
      request.params.get('status') === 'PUBLISHED' &&
      request.params.get('q') === 'test' &&
      request.params.get('page') === '1' &&
      request.params.get('size') === '20'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for getById endpoint', () => {
    const mockAnnonce = {
      id: 1,
      orgId: 'org1',
      title: 'Test Annonce',
      status: AnnonceStatus.PUBLISHED,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user1',
      updatedBy: 'user1'
    };

    service.getById(1).subscribe(response => {
      expect(response).toEqual(mockAnnonce);
    });

    const req = httpMock.expectOne('/api/v1/annonces/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockAnnonce);
  });

  it('should call POST for create endpoint', () => {
    const createRequest: AnnonceCreateRequest = {
      title: 'New Annonce',
      description: 'Description',
      category: 'Category',
      city: 'City',
      price: 100,
      currency: 'EUR'
    };

    const mockResponse = {
      id: 1,
      orgId: 'org1',
      ...createRequest,
      status: AnnonceStatus.DRAFT,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user1',
      updatedBy: 'user1'
    };

    service.create(createRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/annonces');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockResponse);
  });

  it('should call PUT for update endpoint', () => {
    const updateRequest: AnnonceUpdateRequest = {
      title: 'Updated Title',
      status: AnnonceStatus.PUBLISHED
    };

    const mockResponse = {
      id: 1,
      orgId: 'org1',
      title: 'Updated Title',
      status: AnnonceStatus.PUBLISHED,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T01:00:00Z',
      createdBy: 'user1',
      updatedBy: 'user1'
    };

    service.update(1, updateRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/annonces/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(mockResponse);
  });
});
