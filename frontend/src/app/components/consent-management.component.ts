import { Component, Input, OnInit } from '@angular/core';
import { CustomerPortalService } from '../services/customer-portal.service';

@Component({
  selector: 'app-consent-management',
  template: `
    <div class="consent-container">
      <h2>Préférences de communication</h2>
      <p class="intro">Gérez vos préférences pour recevoir des communications</p>
      
      <div class="consent-list">
        <div *ngFor="let consent of consents" class="consent-item">
          <div class="consent-info">
            <div class="consent-channel">
              <span class="channel-icon">{{ getChannelIcon(consent.channel) }}</span>
              <span class="channel-name">{{ getChannelName(consent.channel) }}</span>
            </div>
            <div class="consent-type">{{ consent.consentType }}</div>
          </div>
          <div class="consent-toggle">
            <label class="switch">
              <input type="checkbox" 
                     [checked]="consent.status === 'GRANTED'"
                     (change)="toggleConsent(consent, $event)">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="consent-footer">
        <p class="disclaimer">
          Vous pouvez modifier vos préférences à tout moment. 
          Certaines communications essentielles liées à votre dossier ne peuvent pas être désactivées.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .consent-container {
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 600px;
      margin: 0 auto;
    }

    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #333;
    }

    .intro {
      color: #666;
      margin-bottom: 24px;
    }

    .consent-list {
      border-top: 1px solid #e0e0e0;
    }

    .consent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .consent-info {
      flex: 1;
    }

    .consent-channel {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .channel-icon {
      font-size: 20px;
    }

    .channel-name {
      font-weight: 500;
      color: #333;
    }

    .consent-type {
      font-size: 14px;
      color: #666;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #667eea;
    }

    input:checked + .slider:before {
      transform: translateX(24px);
    }

    .consent-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .disclaimer {
      font-size: 13px;
      color: #999;
      line-height: 1.5;
    }
  `]
})
export class ConsentManagementComponent implements OnInit {
  @Input() dossierId!: number;
  consents: any[] = [];

  constructor(private portalService: CustomerPortalService) {}

  ngOnInit(): void {
    this.loadConsents();
  }

  loadConsents(): void {
    this.portalService.getConsents(this.dossierId).subscribe({
      next: (consents) => {
        this.consents = consents;
      },
      error: (err) => console.error('Error loading consents:', err)
    });
  }

  toggleConsent(consent: any, event: any): void {
    const newStatus = event.target.checked ? 'GRANTED' : 'DENIED';
    
    this.portalService.updateConsent(consent.id, newStatus).subscribe({
      next: () => {
        consent.status = newStatus;
      },
      error: (err) => {
        console.error('Error updating consent:', err);
        event.target.checked = !event.target.checked;
      }
    });
  }

  getChannelIcon(channel: string): string {
    const icons: Record<string, string> = {
      'EMAIL': '📧',
      'SMS': '💬',
      'WHATSAPP': '📱',
      'PHONE': '☎️'
    };
    return icons[channel] || '📞';
  }

  getChannelName(channel: string): string {
    const names: Record<string, string> = {
      'EMAIL': 'Email',
      'SMS': 'SMS',
      'WHATSAPP': 'WhatsApp',
      'PHONE': 'Téléphone'
    };
    return names[channel] || channel;
  }
}
