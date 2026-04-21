import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PushNotificationService } from './push-notification.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [PushNotificationService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(PushNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if push notifications are supported', () => {
    const supported = service.isSupported();
    expect(typeof supported).toBe('boolean');
  });
});
