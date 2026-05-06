import { Component, OnInit } from '@angular/core';
import { PwaService } from '../services/pwa.service';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';

@Component({
    selector: 'app-pwa-install-prompt',
    template: `
    @if (showPrompt) {
      <div class="pwa-install-banner" [@slideIn]>
        <div class="banner-content">
          <div class="banner-icon">
            <mat-icon>get_app</mat-icon>
          </div>
          <div class="banner-text">
            <h4>Installer l'application</h4>
            <p>Accédez rapidement à CRM Immobilier depuis votre écran d'accueil</p>
          </div>
          <div class="banner-actions">
            <button mat-button (click)="dismiss()" class="btn-dismiss">
              Plus tard
            </button>
            <button mat-raised-button color="primary" (click)="install()" class="btn-install">
              Installer
            </button>
          </div>
        </div>
        <button mat-icon-button class="btn-close" (click)="dismiss()" aria-label="Fermer">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    }
    `,
    styles: [`
    .pwa-install-banner {
      position: fixed;
      bottom: 80px;
      left: var(--ds-space-4);
      right: var(--ds-space-4);
      background: var(--ds-surface);
      border-radius: var(--ds-radius-lg);
      box-shadow: var(--ds-shadow-lg);
      padding: var(--ds-space-4);
      z-index: 1001; /* au-dessus de la barre mobile (1000) ; non couvert par l’échelle --ds-z-* */
      max-width: 500px;
      margin: 0 auto;
    }

    @media (min-width: 768px) {
      .pwa-install-banner {
        bottom: var(--ds-space-6);
        left: var(--ds-space-6);
        right: auto;
      }
    }

    .banner-content {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-3);
    }

    .banner-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--ds-marine) 0%, var(--ds-marine-light) 100%);
      border-radius: var(--ds-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ds-text-inverse);
    }

    .banner-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .banner-text {
      flex: 1;
      min-width: 0;
    }

    .banner-text h4 {
      margin: 0 0 var(--ds-space-1) 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--ds-text);
    }

    .banner-text p {
      margin: 0;
      font-size: 13px;
      color: var(--ds-text-muted);
      line-height: 1.4;
    }

    .banner-actions {
      display: flex;
      gap: var(--ds-space-2);
      margin-top: var(--ds-space-3);
      flex-wrap: wrap;
    }

    .btn-dismiss,
    .btn-install {
      min-width: 48px;
      min-height: 40px;
    }

    .btn-install {
      background: linear-gradient(135deg, var(--ds-marine) 0%, var(--ds-marine-hover) 100%);
      color: var(--ds-text-inverse);
    }

    .btn-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
    }

    .btn-close mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Dark theme — surfaces / texte pilotés par les tokens */
    .dark-theme .pwa-install-banner {
      background: var(--ds-surface);
    }

    /* Mobile adjustments */
    @media (max-width: 599px) {
      .pwa-install-banner {
        bottom: 72px;
        left: var(--ds-space-2);
        right: var(--ds-space-2);
      }

      .banner-content {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .banner-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `],
    animations: [],
    imports: [MatIcon, MatButton, MatIconButton]
})
export class PwaInstallPromptComponent implements OnInit {
  showPrompt = false;

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    this.pwaService.getInstallPromptStatus().subscribe(status => {
      this.showPrompt = status;
    });
  }

  async install(): Promise<void> {
    await this.pwaService.promptInstall();
    this.showPrompt = false;
  }

  dismiss(): void {
    this.pwaService.dismissInstallPrompt();
    this.showPrompt = false;
  }
}
