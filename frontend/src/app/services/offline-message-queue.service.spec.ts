import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { OfflineMessageQueueService } from './offline-message-queue.service';
import { MessageApiService, MessageCreateRequest, MessageChannel, MessageDirection } from './message-api.service';

describe('OfflineMessageQueueService', () => {
  let service: OfflineMessageQueueService;
  let messageApiService: jasmine.SpyObj<MessageApiService>;

  beforeEach(() => {
    const messageApiServiceSpy = jasmine.createSpyObj('MessageApiService', ['create']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OfflineMessageQueueService,
        { provide: MessageApiService, useValue: messageApiServiceSpy }
      ]
    });
    
    service = TestBed.inject(OfflineMessageQueueService);
    messageApiService = TestBed.inject(MessageApiService) as jasmine.SpyObj<MessageApiService>;
    
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if online', () => {
    const isOnline = service.isOnline();
    expect(typeof isOnline).toBe('boolean');
  });

  it('should check if syncing', () => {
    const isSyncing = service.isSyncing();
    expect(isSyncing).toBe(false);
  });

  it('should get queue size', () => {
    const size = service.getQueueSize();
    expect(size).toBe(0);
  });

  it('should clear queue', () => {
    service.clearQueue();
    expect(service.getQueueSize()).toBe(0);
  });

  it('should enqueue message when offline', (done) => {
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);
    
    const request: MessageCreateRequest = {
      dossierId: 1,
      content: 'Test message',
      channel: MessageChannel.WHATSAPP,
      direction: MessageDirection.OUTBOUND,
      timestamp: new Date().toISOString()
    };

    service.enqueue(request).subscribe(result => {
      expect(result).toBeNull();
      expect(service.getQueueSize()).toBeGreaterThan(0);
      done();
    });
  });

  it('should send message directly when online', (done) => {
    const mockResponse = { id: 1, content: 'Test' } as any;
    messageApiService.create.and.returnValue(of(mockResponse));
    
    const request: MessageCreateRequest = {
      dossierId: 1,
      content: 'Test message',
      channel: MessageChannel.WHATSAPP,
      direction: MessageDirection.OUTBOUND,
      timestamp: new Date().toISOString()
    };

    service.enqueue(request).subscribe(result => {
      expect(result).toEqual(mockResponse);
      done();
    });
  });

  it('should remove message from queue', () => {
    service.removeFromQueue('test-id');
    expect(service.getQueueSize()).toBe(0);
  });
});
