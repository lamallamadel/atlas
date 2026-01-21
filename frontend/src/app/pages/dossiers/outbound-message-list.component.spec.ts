import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OutboundMessageListComponent } from './outbound-message-list.component';
import { OutboundMessageApiService, OutboundMessageStatus } from '../../services/outbound-message-api.service';

describe('OutboundMessageListComponent', () => {
  let component: OutboundMessageListComponent;
  let fixture: ComponentFixture<OutboundMessageListComponent>;
  let mockOutboundMessageService: jasmine.SpyObj<OutboundMessageApiService>;

  beforeEach(async () => {
    mockOutboundMessageService = jasmine.createSpyObj('OutboundMessageApiService', ['list']);

    await TestBed.configureTestingModule({
      declarations: [ OutboundMessageListComponent ],
      providers: [
        { provide: OutboundMessageApiService, useValue: mockOutboundMessageService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutboundMessageListComponent);
    component = fixture.componentInstance;
    component.dossierId = 1;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load messages on init', () => {
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
      pageable: { sort: { empty: true, sorted: false, unsorted: true }, offset: 0, pageNumber: 0, pageSize: 20, paged: true, unpaged: false },
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

    mockOutboundMessageService.list.and.returnValue(of(mockResponse));

    component.ngOnInit();

    expect(component.messages.length).toBe(1);
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading messages', () => {
    mockOutboundMessageService.list.and.returnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.error).toBe('Échec du chargement des messages');
    expect(component.loading).toBe(false);
  });

  it('should emit retry event when onRetry is called', () => {
    const message = {
      id: 1,
      orgId: 'org1',
      dossierId: 1,
      recipientPhone: '+33612345678',
      content: 'Test',
      status: OutboundMessageStatus.FAILED,
      channel: 'WHATSAPP',
      attemptCount: 1,
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2024-01-15T10:00:00'
    };

    spyOn(component.retryMessage, 'emit');
    component.onRetry(message);

    expect(component.retryMessage.emit).toHaveBeenCalledWith(message);
  });

  it('should return correct status badge class', () => {
    expect(component.getStatusBadgeClass(OutboundMessageStatus.QUEUED)).toBe('status-badge status-queued');
    expect(component.getStatusBadgeClass(OutboundMessageStatus.SENDING)).toBe('status-badge status-sending');
    expect(component.getStatusBadgeClass(OutboundMessageStatus.SENT)).toBe('status-badge status-sent');
    expect(component.getStatusBadgeClass(OutboundMessageStatus.FAILED)).toBe('status-badge status-failed');
  });

  it('should only allow retry for failed messages', () => {
    const failedMessage = {
      id: 1,
      orgId: 'org1',
      dossierId: 1,
      recipientPhone: '+33612345678',
      content: 'Test',
      status: OutboundMessageStatus.FAILED,
      channel: 'WHATSAPP',
      attemptCount: 1,
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2024-01-15T10:00:00'
    };

    const sentMessage = { ...failedMessage, status: OutboundMessageStatus.SENT };

    expect(component.canRetry(failedMessage)).toBe(true);
    expect(component.canRetry(sentMessage)).toBe(false);
  });
});
