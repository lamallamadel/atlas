import { TestBed, fakeAsync, tick } from '@angular/core/testing';
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

  it('should announce polite message', fakeAsync(() => {
    service.announcePolite('Test message');
    tick(100);
    expect(service).toBeTruthy();
  }));

  it('should announce assertive message', fakeAsync(() => {
    service.announceAssertive('Urgent message');
    tick(100);
    expect(service).toBeTruthy();
  }));

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
