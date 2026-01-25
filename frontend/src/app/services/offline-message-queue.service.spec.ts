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
    
    messageApiService = TestBed.inject(MessageApiService) as jasmine.SpyObj<MessageApiService>;
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    service = TestBed.inject(OfflineMessageQueueService);
    expect(service).toBeTruthy();
  });

  it('should check if online', () => {
    service = TestBed.inject(OfflineMessageQueueService);
    const isOnline = service.isOnline();
    expect(typeof isOnline).toBe('boolean');
  });

  it('should check if syncing', () => {
    service = TestBed.inject(OfflineMessageQueueService);
    const isSyncing = service.isSyncing();
    expect(isSyncing).toBe(false);
  });

  it('should get queue size', () => {
    service = TestBed.inject(OfflineMessageQueueService);
    const size = service.getQueueSize();
    expect(size).toBe(0);
  });

  it('should clear queue', () => {
    service = TestBed.inject(OfflineMessageQueueService);
    service.clearQueue();
    expect(service.getQueueSize()).toBe(0);
  });

  it('should enqueue message when offline', (done) => {
    const originalOnline = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(navigator), 'onLine');
    Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
    
    service = TestBed.inject(OfflineMessageQueueService);
    
    const request: MessageCreateRequest = {
      dossierId: 1,
      content: 'Test message',
      channel: MessageChannel.WHATSAPP,
      direction: MessageDirection.OUTBOUND,
      timestamp: new Date().toISOString()
    };

    service.enqueue(request).subscribe(res => {
      expect(res).toBeNull();
      expect(service.getQueueSize()).toBeGreaterThan(0);
      
      if (originalOnline) {
        Object.defineProperty(navigator, 'onLine', originalOnline);
      }
      done();
    });
  });

  it('should send message directly when online', (done) => {
    service = TestBed.inject(OfflineMessageQueueService);
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
    service = TestBed.inject(OfflineMessageQueueService);
    service.removeFromQueue('test-id');
    expect(service.getQueueSize()).toBe(0);
  });
});
