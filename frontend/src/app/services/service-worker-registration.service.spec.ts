import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ServiceWorkerRegistrationService } from './service-worker-registration.service';
import { NotificationService } from './notification.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ServiceWorkerRegistrationService', () => {
  let service: ServiceWorkerRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [MatSnackBarModule],
    providers: [NotificationService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(ServiceWorkerRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide state observable', (done) => {
    service.state$.subscribe(state => {
      expect(state).toBeDefined();
      expect(state.registered).toBeDefined();
      done();
    });
  });
});
