import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OfflineInterceptor } from './offline.interceptor';
import { OfflineService } from '../services/offline.service';
import { OfflineQueueService } from '../services/offline-queue.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { NotificationService } from '../services/notification.service';

describe('OfflineInterceptor', () => {
  let interceptor: OfflineInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OfflineInterceptor,
        OfflineService,
        OfflineQueueService,
        OfflineStorageService,
        NotificationService
      ]
    });
    interceptor = TestBed.inject(OfflineInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
