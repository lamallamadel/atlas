import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface VoipConfiguration {
  enabled: boolean;
  provider: 'twilio' | 'asterisk' | 'custom' | null;
  clickToCallUrl?: string;
  apiKey?: string;
  phoneNumberFormat?: string;
}

export interface CallSession {
  callId: string;
  phoneNumber: string;
  contactName: string;
  status: 'initiating' | 'ringing' | 'connected' | 'ended' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VoipService {
  private readonly VOIP_CONFIG_KEY = 'voip_configuration';
  
  private configSubject = new BehaviorSubject<VoipConfiguration | null>(null);
  public config$ = this.configSubject.asObservable();
  
  private activeCallSubject = new BehaviorSubject<CallSession | null>(null);
  public activeCall$ = this.activeCallSubject.asObservable();
  
  private callHistorySubject = new BehaviorSubject<CallSession[]>([]);
  public callHistory$ = this.callHistorySubject.asObservable();

  constructor() {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    const stored = localStorage.getItem(this.VOIP_CONFIG_KEY);
    if (stored) {
      try {
        const config = JSON.parse(stored) as VoipConfiguration;
        this.configSubject.next(config);
      } catch (e) {
        console.error('Failed to load VoIP configuration', e);
      }
    } else {
      const defaultConfig: VoipConfiguration = {
        enabled: false,
        provider: null
      };
      this.configSubject.next(defaultConfig);
    }
  }

  isConfigured(): boolean {
    const config = this.configSubject.value;
    return config !== null && config.enabled && config.provider !== null;
  }

  getConfiguration(): VoipConfiguration | null {
    return this.configSubject.value;
  }

  setConfiguration(config: VoipConfiguration): void {
    this.configSubject.next(config);
    localStorage.setItem(this.VOIP_CONFIG_KEY, JSON.stringify(config));
  }

  initiateCall(phoneNumber: string, contactName: string): void {
    const config = this.configSubject.value;
    
    if (!this.isConfigured() || !config) {
      console.error('VoIP is not configured');
      return;
    }

    const callSession: CallSession = {
      callId: this.generateCallId(),
      phoneNumber,
      contactName,
      status: 'initiating',
      startTime: new Date()
    };

    this.activeCallSubject.next(callSession);

    switch (config.provider) {
      case 'twilio':
        this.initiateTwilioCall(phoneNumber);
        break;
      case 'asterisk':
        this.initiateAsteriskCall(phoneNumber);
        break;
      case 'custom':
        this.initiateCustomCall(phoneNumber, config.clickToCallUrl);
        break;
      default:
        this.initiateClickToCall(phoneNumber, config.clickToCallUrl);
    }

    setTimeout(() => {
      this.updateCallStatus('ringing');
    }, 1000);

    setTimeout(() => {
      this.updateCallStatus('connected');
    }, 3000);
  }

  private initiateTwilioCall(phoneNumber: string): void {
    console.log('Initiating Twilio call to:', phoneNumber);
  }

  private initiateAsteriskCall(phoneNumber: string): void {
    console.log('Initiating Asterisk call to:', phoneNumber);
  }

  private initiateCustomCall(phoneNumber: string, clickToCallUrl?: string): void {
    if (clickToCallUrl) {
      const url = clickToCallUrl.replace('{phone}', encodeURIComponent(phoneNumber));
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('No click-to-call URL configured');
    }
  }

  private initiateClickToCall(phoneNumber: string, clickToCallUrl?: string): void {
    if (clickToCallUrl) {
      const url = clickToCallUrl.replace('{phone}', encodeURIComponent(phoneNumber));
      window.location.href = url;
    } else {
      window.location.href = `tel:${phoneNumber}`;
    }
  }

  updateCallStatus(status: CallSession['status']): void {
    const activeCall = this.activeCallSubject.value;
    if (!activeCall) {
      return;
    }

    const updatedCall: CallSession = {
      ...activeCall,
      status
    };

    if (status === 'ended' || status === 'failed') {
      updatedCall.endTime = new Date();
      updatedCall.duration = Math.floor(
        (updatedCall.endTime.getTime() - updatedCall.startTime.getTime()) / 1000
      );
      
      this.addToCallHistory(updatedCall);
      this.activeCallSubject.next(null);
    } else {
      this.activeCallSubject.next(updatedCall);
    }
  }

  endCall(): void {
    this.updateCallStatus('ended');
  }

  private addToCallHistory(call: CallSession): void {
    const history = this.callHistorySubject.value;
    const updatedHistory = [call, ...history].slice(0, 50);
    this.callHistorySubject.next(updatedHistory);
  }

  getCallHistory(): CallSession[] {
    return this.callHistorySubject.value;
  }

  clearCallHistory(): void {
    this.callHistorySubject.next([]);
  }

  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatPhoneNumber(phoneNumber: string): string {
    const config = this.configSubject.value;
    if (!config || !config.phoneNumberFormat) {
      return phoneNumber;
    }

    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (config.phoneNumberFormat === 'international' && cleaned.length === 10) {
      return `+33${cleaned.substring(1)}`;
    }
    
    return phoneNumber;
  }
}
