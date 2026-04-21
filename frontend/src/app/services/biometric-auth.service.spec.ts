import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BiometricAuthService } from './biometric-auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('BiometricAuthService', () => {
  let service: BiometricAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [BiometricAuthService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(BiometricAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if biometric authentication is supported', async () => {
    const supported = await service.isSupported();
    expect(typeof supported).toBe('boolean');
  });
});
