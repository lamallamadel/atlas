import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ServiceWorkerRegistrationService } from './service-worker-registration.service';
import { NotificationService } from './notification.service';

describe('ServiceWorkerRegistrationService', () => {
  let service: ServiceWorkerRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService]
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
