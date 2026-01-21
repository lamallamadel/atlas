import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OutboundMessageApiService, OutboundMessageStatus, OutboundMessageCreateRequest, OutboundMessageResponse } from './outbound-message-api.service';

describe('OutboundMessageApiService', () => {
  let service: OutboundMessageApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OutboundMessageApiService]
    });
    service = TestBed.inject(OutboundMessageApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch outbound messages with filters', () => {
      const mockResponse = {
        content: [
          {
            id: 1,
            orgId: 'org1',
            dossierId: 1,
            recipientPhone: '+33612345678',
            content: 'Test message',
            status: OutboundMessageStatus.SENT,
            channel: 'WHATSAPP',
            attemptCount: 1,
            createdAt: '2024-01-15T10:00:00',
            updatedAt: '2024-01-15T10:00:00'
          }
        ],
        pageable: {
          sort: { empty: true, sorted: false, unsorted: true },
          offset: 0,
          pageNumber: 0,
          pageSize: 20,
          paged: true,
          unpaged: false
        },
        last: true,
        totalPages: 1,
        totalElements: 1,
        size: 20,
        number: 0,
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: 1,
        empty: false
      };

      service.list({ dossierId: 1, status: OutboundMessageStatus.SENT }).subscribe(response => {
        expect(response.content.length).toBe(1);
        expect(response.content[0].status).toBe(OutboundMessageStatus.SENT);
      });

      const req = httpMock.expectOne(request => 
        request.url === '/api/v1/outbound-messages' &&
        request.params.get('dossierId') === '1' &&
        request.params.get('status') === 'SENT'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('create', () => {
    it('should create an outbound message', () => {
      const createRequest: OutboundMessageCreateRequest = {
        dossierId: 1,
        recipientPhone: '+33612345678',
        content: 'Test message',
        channel: 'WHATSAPP',
        templateId: 'greeting',
        templateVariables: { name: 'John' }
      };

      const mockResponse: OutboundMessageResponse = {
        id: 1,
        orgId: 'org1',
        dossierId: 1,
        recipientPhone: '+33612345678',
        content: 'Bonjour John, merci de votre intérêt.',
        status: OutboundMessageStatus.QUEUED,
        channel: 'WHATSAPP',
        attemptCount: 0,
        templateId: 'greeting',
        templateVariables: { name: 'John' },
        createdAt: '2024-01-15T10:00:00',
        updatedAt: '2024-01-15T10:00:00'
      };

      service.create(createRequest).subscribe(response => {
        expect(response.id).toBe(1);
        expect(response.status).toBe(OutboundMessageStatus.QUEUED);
        expect(response.templateId).toBe('greeting');
      });

      const req = httpMock.expectOne('/api/v1/outbound-messages');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockResponse);
    });
  });

  describe('retry', () => {
    it('should retry a failed message', () => {
      const mockResponse: OutboundMessageResponse = {
        id: 1,
        orgId: 'org1',
        dossierId: 1,
        recipientPhone: '+33612345678',
        content: 'Test message',
        status: OutboundMessageStatus.QUEUED,
        channel: 'WHATSAPP',
        attemptCount: 2,
        createdAt: '2024-01-15T10:00:00',
        updatedAt: '2024-01-15T10:05:00'
      };

      service.retry(1).subscribe(response => {
        expect(response.status).toBe(OutboundMessageStatus.QUEUED);
        expect(response.attemptCount).toBe(2);
      });

      const req = httpMock.expectOne('/api/v1/outbound-messages/1/retry');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('listTemplates', () => {
    it('should fetch message templates', () => {
      const mockTemplates = [
        {
          id: 'greeting',
          name: 'Salutation',
          content: 'Bonjour {{name}}, merci de votre intérêt.',
          variables: ['name'],
          channel: 'WHATSAPP'
        },
        {
          id: 'followup',
          name: 'Suivi',
          content: 'Bonjour {{name}}, je reviens vers vous concernant {{property}}.',
          variables: ['name', 'property'],
          channel: 'WHATSAPP'
        }
      ];

      service.listTemplates().subscribe(templates => {
        expect(templates.length).toBe(2);
        expect(templates[0].id).toBe('greeting');
        expect(templates[1].variables).toContain('property');
      });

      const req = httpMock.expectOne('/api/v1/outbound-messages/templates');
      expect(req.request.method).toBe('GET');
      req.flush(mockTemplates);
    });
  });
});
