import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MessageApiService, MessageChannel, MessageDirection } from './message-api.service';

describe('MessageApiService', () => {
  let service: MessageApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MessageApiService]
    });
    service = TestBed.inject(MessageApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should encode channel filter in query params', () => {
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

    service.list({ dossierId: 123, channel: MessageChannel.EMAIL }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/messages' &&
      request.params.get('dossierId') === '123' &&
      request.params.get('channel') === 'EMAIL'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should encode direction filter in query params', () => {
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

    service.list({ dossierId: 123, direction: MessageDirection.INBOUND }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/messages' &&
      request.params.get('dossierId') === '123' &&
      request.params.get('direction') === 'INBOUND'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should encode both channel and direction filters in query params', () => {
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
      channel: MessageChannel.SMS,
      direction: MessageDirection.OUTBOUND,
      page: 1,
      size: 20,
      sort: 'timestamp,desc'
    }).subscribe(response => {
      expect(response).toEqual(mockPage);
    });

    const req = httpMock.expectOne(request =>
      request.url === '/api/v1/messages' &&
      request.params.get('dossierId') === '123' &&
      request.params.get('channel') === 'SMS' &&
      request.params.get('direction') === 'OUTBOUND' &&
      request.params.get('page') === '1' &&
      request.params.get('size') === '20' &&
      request.params.get('sort') === 'timestamp,desc'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should call GET for getById endpoint', () => {
    const mockResponse: any = {
      id: 1,
      orgId: 'org1',
      dossierId: 123,
      channel: MessageChannel.EMAIL,
      direction: MessageDirection.INBOUND,
      content: 'Test message',
      timestamp: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z'
    };

    service.getById(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/messages/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call POST for create endpoint', () => {
    const createRequest: any = {
      dossierId: 123,
      channel: MessageChannel.EMAIL,
      direction: MessageDirection.OUTBOUND,
      content: 'New message',
      timestamp: '2024-01-01T00:00:00Z'
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

    const req = httpMock.expectOne('/api/v1/messages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockResponse);
  });
});
