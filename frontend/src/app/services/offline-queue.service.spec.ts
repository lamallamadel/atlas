import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OfflineQueueService, QueuedActionType } from './offline-queue.service';
import { OfflineService } from './offline.service';
import { OfflineStorageService } from './offline-storage.service';
import { NotificationService } from './notification.service';

describe('OfflineQueueService', () => {
  let service: OfflineQueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OfflineQueueService,
        OfflineService,
        OfflineStorageService,
        NotificationService
      ]
    });
    service = TestBed.inject(OfflineQueueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide sync progress observable', (done) => {
    service.syncProgress$.subscribe(progress => {
      expect(progress).toBeDefined();
      expect(progress.total).toBeDefined();
      expect(progress.completed).toBeDefined();
      done();
    });
  });
});
