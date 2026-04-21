import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationApiService } from './notification-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('NotificationApiService', () => {
  let service: NotificationApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [NotificationApiService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(NotificationApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
