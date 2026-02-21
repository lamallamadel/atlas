import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BiometricAuthService } from './biometric-auth.service';

describe('BiometricAuthService', () => {
  let service: BiometricAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BiometricAuthService]
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
