import { Injectable } from '@angular/core';
import { AriaLiveAnnouncerService, AnnounceMode } from './aria-live-announcer.service';

export type PolitenessLevel = 'polite' | 'assertive';

@Injectable({
  providedIn: 'root'
})
export class LiveAnnouncerService {
  constructor(private ariaAnnouncer: AriaLiveAnnouncerService) {}

  announce(message: string, politeness: PolitenessLevel = 'polite', duration = 5000): void {
    const mode: AnnounceMode = politeness === 'assertive' ? 'assertive' : 'polite';
    this.ariaAnnouncer.announce(message, mode, duration);
  }

  announcePolite(message: string): void {
    this.ariaAnnouncer.announcePolite(message);
  }

  announceAssertive(message: string): void {
    this.ariaAnnouncer.announceAssertive(message);
  }

  clear(): void {
    this.ariaAnnouncer.clear();
  }
}
