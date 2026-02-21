import { TestBed } from '@angular/core/testing';
import { PwaService } from './pwa.service';

describe('PwaService', () => {
  let service: PwaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PwaService]
    });
    service = TestBed.inject(PwaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if PWA is supported', () => {
    const supported = service.isPWASupported();
    expect(typeof supported).toBe('boolean');
  });

  it('should get display mode', () => {
    const displayMode = service.getDisplayMode();
    expect(['browser', 'standalone', 'minimal-ui', 'fullscreen']).toContain(displayMode);
  });
});
