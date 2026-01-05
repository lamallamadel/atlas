import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentApiService, AppointmentStatus } from './appointment-api.service';

describe('AppointmentApiService', () => {
  let service: AppointmentApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppointmentApiService]
    });
    service = TestBed.inject(AppointmentApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should encode date range filters in query params', () => {
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
      status: AppointmentStatus.SCHEDULED,
      page: 0,
      size: 10,
      sort: 'startTime,asc'
    }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/appointments' &&
      request.params.get('dossierId') === '123' &&
      request.params.get('status') === 'SCHEDULED' &&
      request.params.get('page') === '0' &&
      request.params.get('size') === '10' &&
      request.params.get('sort') === 'startTime,asc'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for list endpoint with dossierId only', () => {
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

    service.list({ dossierId: 456 }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/appointments' &&
      request.params.get('dossierId') === '456'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
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

    const req = httpMock.expectOne('/api/v1/appointments');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for getById endpoint', () => {
    const mockResponse: any = {
      id: 1,
      orgId: 'org1',
      dossierId: 123,
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
      location: 'Office',
      status: AppointmentStatus.SCHEDULED,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    service.getById(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/appointments/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call POST for create endpoint', () => {
    const createRequest: any = {
      dossierId: 123,
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
      location: 'Office',
      assignedTo: 'Agent 1',
      notes: 'Test appointment',
      status: AppointmentStatus.SCHEDULED
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

    const req = httpMock.expectOne('/api/v1/appointments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockResponse);
  });

  it('should call PUT for update endpoint', () => {
    const updateRequest: any = {
      startTime: '2024-01-15T14:00:00Z',
      endTime: '2024-01-15T15:00:00Z',
      location: 'Client Site',
      assignedTo: 'Agent 2',
      notes: 'Updated appointment',
      status: AppointmentStatus.COMPLETED
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

    const req = httpMock.expectOne('/api/v1/appointments/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(mockResponse);
  });

  it('should call DELETE for delete endpoint', () => {
    service.delete(1).subscribe();

    const req = httpMock.expectOne('/api/v1/appointments/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
