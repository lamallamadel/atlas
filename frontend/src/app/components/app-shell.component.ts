import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ServiceWorkerRegistrationService } from '../services/service-worker-registration.service';

@Component({
    selector: 'app-shell',
    template: `
    <div class="app-shell" [class.loading]="isLoading">
      <!-- Critical app shell content -->
      <div class="app-shell-header">
        <div class="header-skeleton">
          <div class="logo-skeleton"></div>
          <div class="nav-skeleton">
            <div class="nav-item-skeleton"></div>
            <div class="nav-item-skeleton"></div>
            <div class="nav-item-skeleton"></div>
          </div>
        </div>
      </div>

      <div class="app-shell-content">
        <div class="content-skeleton">
          <div class="card-skeleton"></div>
          <div class="card-skeleton"></div>
          <div class="card-skeleton"></div>
        </div>
      </div>

      <div class="app-shell-footer">
        <div class="footer-skeleton">
          <div class="footer-item-skeleton"></div>
          <div class="footer-item-skeleton"></div>
          <div class="footer-item-skeleton"></div>
          <div class="footer-item-skeleton"></div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .app-shell {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--ds-bg);
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--ds-transition-med);
    }

    .app-shell.loading {
      opacity: 1;
    }

    .app-shell-header {
      height: 64px;
      background: var(--ds-surface);
      border-bottom: 1px solid var(--ds-divider);
      padding: 0 var(--ds-space-6);
      display: flex;
      align-items: center;
    }

    .header-skeleton {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo-skeleton {
      width: 150px;
      height: 36px;
      background: var(--ds-surface-offset);
      border-radius: var(--ds-radius-sm);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .nav-skeleton {
      display: flex;
      gap: var(--ds-space-4);
    }

    .nav-item-skeleton {
      width: 80px;
      height: 32px;
      background: var(--ds-surface-offset);
      border-radius: var(--ds-radius-sm);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .app-shell-content {
      padding: var(--ds-space-6);
      overflow-y: auto;
      height: calc(100vh - 128px);
    }

    @media (max-width: 767px) {
      .app-shell-content {
        height: calc(100vh - 128px - 64px);
        padding: var(--ds-space-4);
      }
    }

    .content-skeleton {
      max-width: var(--ds-content-full);
      margin: 0 auto;
    }

    .card-skeleton {
      background: var(--ds-surface);
      border-radius: var(--ds-radius-md);
      padding: var(--ds-space-6);
      margin-bottom: var(--ds-space-4);
      box-shadow: var(--ds-shadow-sm);
    }

    .card-skeleton::before {
      content: '';
      display: block;
      width: 60%;
      height: 24px;
      background: var(--ds-surface-offset);
      border-radius: var(--ds-radius-sm);
      margin-bottom: var(--ds-space-3);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .card-skeleton::after {
      content: '';
      display: block;
      width: 100%;
      height: 80px;
      background: var(--ds-surface-offset);
      border-radius: var(--ds-radius-sm);
      animation: pulse 1.5s ease-in-out infinite;
      animation-delay: 0.2s;
    }

    .app-shell-footer {
      display: none;
    }

    @media (max-width: 767px) {
      .app-shell-footer {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: var(--ds-surface);
        border-top: 1px solid var(--ds-divider);
        padding: var(--ds-space-2) var(--ds-space-4);
      }

      .footer-skeleton {
        display: flex;
        justify-content: space-around;
        height: 100%;
      }

      .footer-item-skeleton {
        width: 60px;
        height: 48px;
        background: var(--ds-surface-offset);
        border-radius: var(--ds-radius-md);
        animation: pulse 1.5s ease-in-out infinite;
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }

    /* Dark theme — tokens */
    .dark-theme .app-shell {
      background: var(--ds-bg);
    }

    .dark-theme .app-shell-header,
    .dark-theme .card-skeleton,
    .dark-theme .app-shell-footer {
      background: var(--ds-surface);
      border-color: var(--ds-border);
    }

    .dark-theme .logo-skeleton,
    .dark-theme .nav-item-skeleton,
    .dark-theme .card-skeleton::before,
    .dark-theme .card-skeleton::after,
    .dark-theme .footer-item-skeleton {
      background: var(--ds-surface-dynamic);
    }
  `]
})
export class AppShellComponent implements OnInit {
  isLoading = true;

  constructor(
    private router: Router,
    private swRegistration: ServiceWorkerRegistrationService
  ) {}

  ngOnInit(): void {
    // Hide app shell once first navigation is complete
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          this.isLoading = false;
        }, 300);
      });

    // Initialize service worker
    this.swRegistration.checkForUpdates();
  }
}
