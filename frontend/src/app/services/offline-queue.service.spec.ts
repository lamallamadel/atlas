import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {} from '@angular/material/snack-bar';
import { OfflineQueueService, QueuedActionType } from './offline-queue.service';
import { OfflineService } from './offline.service';
import { OfflineStorageService } from './offline-storage.service';
import { NotificationService } from './notification.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('OfflineQueueService', () => {
  let service: OfflineQueueService;

  beforeEach(() => {
    const mockNotificationService = {
      success: vi.fn().mockName('NotificationService.success'),
      error: vi.fn().mockName('NotificationService.error'),
      info: vi.fn().mockName('NotificationService.info'),
      warning: vi.fn().mockName('NotificationService.warning'),
      critical: vi.fn().mockName('NotificationService.critical'),
    };

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        {
          provide: MatSnackBar,
          useValue: {
            open: () => ({
              onAction: () => of(null),
              afterDismissed: () => of(null),
            }),
            dismiss: () => {},
          },
        },
        OfflineQueueService,
        OfflineService,
        OfflineStorageService,
        { provide: NotificationService, useValue: mockNotificationService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(OfflineQueueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide sync progress observable', async () => {
    service.syncProgress$.subscribe((progress) => {
      expect(progress).toBeDefined();
      expect(progress.total).toBeDefined();
      expect(progress.completed).toBeDefined();
    });
  });
});
