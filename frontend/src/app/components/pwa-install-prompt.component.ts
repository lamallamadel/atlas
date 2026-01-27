import { Component, OnInit } from '@angular/core';
import { PwaService } from '../services/pwa.service';

@Component({
  selector: 'app-pwa-install-prompt',
  template: `
    <div class="pwa-install-banner" *ngIf="showPrompt" [@slideIn]>
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
  `,
  styles: [`
    .pwa-install-banner {
      position: fixed;
      bottom: 80px;
      left: 16px;
      right: 16px;
      background: var(--color-neutral-0, #ffffff);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      padding: 16px;
      z-index: 1001;
      max-width: 500px;
      margin: 0 auto;
    }

    @media (min-width: 768px) {
      .pwa-install-banner {
        bottom: 24px;
        left: 24px;
        right: auto;
      }
    }

    .banner-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .banner-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--color-primary-500, #2c5aa0) 0%, var(--color-primary-700, #1f4782) 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
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
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-neutral-900, #212121);
    }

    .banner-text p {
      margin: 0;
      font-size: 13px;
      color: var(--color-neutral-600, #757575);
      line-height: 1.4;
    }

    .banner-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .btn-dismiss,
    .btn-install {
      min-width: 48px;
      min-height: 40px;
    }

    .btn-install {
      background: linear-gradient(135deg, var(--color-primary-500, #2c5aa0) 0%, var(--color-primary-700, #1f4782) 100%);
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

    /* Dark theme */
    .dark-theme .pwa-install-banner {
      background: var(--color-neutral-800, #424242);
    }

    .dark-theme .banner-text h4 {
      color: var(--color-neutral-0, #ffffff);
    }

    .dark-theme .banner-text p {
      color: var(--color-neutral-300, #e0e0e0);
    }

    /* Mobile adjustments */
    @media (max-width: 599px) {
      .pwa-install-banner {
        bottom: 72px;
        left: 8px;
        right: 8px;
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
  animations: []
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
