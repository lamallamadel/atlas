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
      background: var(--color-neutral-100, #f5f5f5);
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .app-shell.loading {
      opacity: 1;
    }

    .app-shell-header {
      height: 64px;
      background: var(--color-neutral-0, #ffffff);
      border-bottom: 1px solid var(--color-neutral-200, #e0e0e0);
      padding: 0 24px;
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
      background: var(--color-neutral-200, #e0e0e0);
      border-radius: 4px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .nav-skeleton {
      display: flex;
      gap: 16px;
    }

    .nav-item-skeleton {
      width: 80px;
      height: 32px;
      background: var(--color-neutral-200, #e0e0e0);
      border-radius: 4px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .app-shell-content {
      padding: 24px;
      overflow-y: auto;
      height: calc(100vh - 128px);
    }

    @media (max-width: 767px) {
      .app-shell-content {
        height: calc(100vh - 128px - 64px);
        padding: 16px;
      }
    }

    .content-skeleton {
      max-width: 1200px;
      margin: 0 auto;
    }

    .card-skeleton {
      background: var(--color-neutral-0, #ffffff);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card-skeleton::before {
      content: '';
      display: block;
      width: 60%;
      height: 24px;
      background: var(--color-neutral-200, #e0e0e0);
      border-radius: 4px;
      margin-bottom: 12px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .card-skeleton::after {
      content: '';
      display: block;
      width: 100%;
      height: 80px;
      background: var(--color-neutral-200, #e0e0e0);
      border-radius: 4px;
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
        background: var(--color-neutral-0, #ffffff);
        border-top: 1px solid var(--color-neutral-200, #e0e0e0);
        padding: 8px 16px;
      }

      .footer-skeleton {
        display: flex;
        justify-content: space-around;
        height: 100%;
      }

      .footer-item-skeleton {
        width: 60px;
        height: 48px;
        background: var(--color-neutral-200, #e0e0e0);
        border-radius: 8px;
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

    /* Dark theme */
    .dark-theme .app-shell {
      background: var(--color-neutral-900, #212121);
    }

    .dark-theme .app-shell-header,
    .dark-theme .card-skeleton,
    .dark-theme .app-shell-footer {
      background: var(--color-neutral-800, #424242);
      border-color: var(--color-neutral-700, #616161);
    }

    .dark-theme .logo-skeleton,
    .dark-theme .nav-item-skeleton,
    .dark-theme .card-skeleton::before,
    .dark-theme .card-skeleton::after,
    .dark-theme .footer-item-skeleton {
      background: var(--color-neutral-700, #616161);
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
