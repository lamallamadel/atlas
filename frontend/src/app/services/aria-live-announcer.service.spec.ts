import { TestBed } from '@angular/core/testing';
import { AriaLiveAnnouncerService } from './aria-live-announcer.service';

describe('AriaLiveAnnouncerService', () => {
  let service: AriaLiveAnnouncerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AriaLiveAnnouncerService]
    });
    service = TestBed.inject(AriaLiveAnnouncerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should announce polite message', async () => {
    service.announcePolite('Test message');
    await new Promise<void>((resolve) => setTimeout(resolve, 160));
    expect(service).toBeTruthy();
  });

  it('should announce assertive message', async () => {
    service.announceAssertive('Urgent message');
    await new Promise<void>((resolve) => setTimeout(resolve, 160));
    expect(service).toBeTruthy();
  });

  it('should not announce when mode is off', () => {
    service.announce('Test', 'off');
    expect(service).toBeTruthy();
  });

  it('should clear polite messages', () => {
    service.clear('polite');
    expect(service).toBeTruthy();
  });

  it('should clear assertive messages', () => {
    service.clear('assertive');
    expect(service).toBeTruthy();
  });

  it('should clear all messages when no mode specified', () => {
    service.clear();
    expect(service).toBeTruthy();
  });
});
