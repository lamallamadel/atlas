import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {} from '@angular/material/snack-bar';
import { OfflineInterceptor } from './offline.interceptor';
import { OfflineService } from '../services/offline.service';
import { OfflineQueueService } from '../services/offline-queue.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { NotificationService } from '../services/notification.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('OfflineInterceptor', () => {
  let interceptor: OfflineInterceptor;

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
        OfflineInterceptor,
        OfflineService,
        OfflineQueueService,
        OfflineStorageService,
        { provide: NotificationService, useValue: mockNotificationService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    interceptor = TestBed.inject(OfflineInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
