import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { OfflineInterceptor } from './offline.interceptor';
import { OfflineService } from '../services/offline.service';
import { OfflineQueueService } from '../services/offline-queue.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { NotificationService } from '../services/notification.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('OfflineInterceptor', () => {
  let interceptor: OfflineInterceptor;

  beforeEach(() => {
    const mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info', 'warning', 'critical']);

    TestBed.configureTestingModule({
    imports: [MatSnackBarModule],
    providers: [
        OfflineInterceptor,
        OfflineService,
        OfflineQueueService,
        OfflineStorageService,
        { provide: NotificationService, useValue: mockNotificationService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    interceptor = TestBed.inject(OfflineInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
