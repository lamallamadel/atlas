import { TestBed } from '@angular/core/testing';
import { VoipService, VoipConfiguration, CallSession } from './voip.service';

describe('VoipService', () => {
  let service: VoipService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for isConfigured when not configured', () => {
    expect(service.isConfigured()).toBe(false);
  });

  it('should return true for isConfigured when properly configured', () => {
    const config: VoipConfiguration = {
      enabled: true,
      provider: 'twilio',
      clickToCallUrl: 'https://example.com/call/{phone}',
      apiKey: 'test-key'
    };

    service.setConfiguration(config);
    expect(service.isConfigured()).toBe(true);
  });

  it('should persist configuration to localStorage', () => {
    const config: VoipConfiguration = {
      enabled: true,
      provider: 'asterisk',
      clickToCallUrl: 'https://example.com/call/{phone}'
    };

    service.setConfiguration(config);
    const stored = localStorage.getItem('voip_configuration');
    expect(stored).toBeTruthy();
    
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.enabled).toBe(true);
      expect(parsed.provider).toBe('asterisk');
    }
  });

  it('should initiate call and update status', (done) => {
    const config: VoipConfiguration = {
      enabled: true,
      provider: 'custom',
      clickToCallUrl: 'tel:{phone}'
    };

    service.setConfiguration(config);
    
    service.activeCall$.subscribe(call => {
      if (call && call.status === 'initiating') {
        expect(call.phoneNumber).toBe('+33612345678');
        expect(call.contactName).toBe('John Doe');
        done();
      }
    });

    service.initiateCall('+33612345678', 'John Doe');
  });

  it('should add call to history when ended', (done) => {
    const config: VoipConfiguration = {
      enabled: true,
      provider: 'custom',
      clickToCallUrl: 'tel:{phone}'
    };

    service.setConfiguration(config);
    service.initiateCall('+33612345678', 'John Doe');

    setTimeout(() => {
      service.endCall();
      const history = service.getCallHistory();
      expect(history.length).toBe(1);
      expect(history[0].status).toBe('ended');
      done();
    }, 100);
  });

  it('should clear call history', () => {
    const config: VoipConfiguration = {
      enabled: true,
      provider: 'twilio'
    };

    service.setConfiguration(config);
    service.initiateCall('+33612345678', 'John Doe');
    service.endCall();

    service.clearCallHistory();
    const history = service.getCallHistory();
    expect(history.length).toBe(0);
  });

  it('should format phone number to international format', () => {
    const config: VoipConfiguration = {
      enabled: true,
      provider: 'twilio',
      phoneNumberFormat: 'international'
    };

    service.setConfiguration(config);
    const formatted = service.formatPhoneNumber('0612345678');
    expect(formatted).toBe('+33612345678');
  });
});
