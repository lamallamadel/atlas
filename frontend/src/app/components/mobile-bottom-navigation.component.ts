import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIcon } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
    selector: 'app-mobile-bottom-navigation',
    template: `
    @if (shouldShowNav) {
      <nav class="mobile-bottom-nav" role="navigation" aria-label="Navigation principale mobile">
        @for (item of navItems; track item) {
          <button
            class="nav-item"
            [class.active]="isActive(item.route)"
            (click)="navigate(item.route)"
            [attr.aria-label]="item.label"
            [attr.aria-current]="isActive(item.route) ? 'page' : null"
            type="button">
            <div class="nav-icon-wrapper">
              <mat-icon [attr.aria-hidden]="true">{{ item.icon }}</mat-icon>
              @if (item.badge && item.badge > 0) {
                <span class="badge" [attr.aria-label]="item.badge + ' notifications'">
                  {{ item.badge > 99 ? '99+' : item.badge }}
                </span>
              }
            </div>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        }
      </nav>
    }
    `,
    styles: [`
    .mobile-bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--ds-surface);
      border-top: 1px solid var(--ds-divider);
      box-shadow: 0 -4px 16px color-mix(in srgb, var(--ds-text) 8%, transparent);
      z-index: 1000;
      height: 64px;
      padding-bottom: env(safe-area-inset-bottom);
    }

    @media (max-width: 767px) {
      .mobile-bottom-nav {
        display: flex;
        justify-content: space-around;
        align-items: stretch;
      }
    }

    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--ds-space-2) var(--ds-space-1);
      border: none;
      background: transparent;
      color: var(--ds-text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      min-width: 48px;
      min-height: 48px;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    .nav-item:active {
      transform: scale(0.95);
    }

    .nav-item.active {
      color: var(--ds-marine);
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 32px;
      height: 3px;
      background: var(--ds-marine);
      border-radius: 0 0 var(--ds-radius-sm) var(--ds-radius-sm);
    }

    .nav-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .nav-label {
      font-size: 11px;
      font-weight: 500;
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .badge {
      position: absolute;
      top: -4px;
      right: -8px;
      background: var(--ds-error);
      color: var(--ds-text-inverse);
      font-size: 10px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
      line-height: 1.2;
    }

    /* Dark theme — tokens */
    .dark-theme .mobile-bottom-nav {
      background: var(--ds-surface);
      border-top-color: var(--ds-border);
    }

    .dark-theme .nav-item {
      color: var(--ds-text-muted);
    }

    .dark-theme .nav-item.active {
      color: var(--ds-marine-light);
    }

    .dark-theme .nav-item.active::before {
      background: var(--ds-marine-light);
    }

    /* Safe area support for notched devices */
    @supports (padding: env(safe-area-inset-bottom)) {
      .mobile-bottom-nav {
        padding-bottom: calc(8px + env(safe-area-inset-bottom));
      }
    }
  `],
    imports: [MatIcon]
})
export class MobileBottomNavigationComponent implements OnInit {
  currentRoute = '';
  shouldShowNav = true;

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
    { label: 'Dossiers', icon: 'folder', route: '/dossiers' },
    { label: 'Annonces', icon: 'home', route: '/annonces' },
    { label: 'Plus', icon: 'menu', route: '/menu' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        this.updateVisibility();
      });

    this.updateVisibility();
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  private updateVisibility(): void {
    // Hide bottom nav on login and full-screen pages
    const hideRoutes = ['/login', '/access-denied', '/session-expired'];
    this.shouldShowNav = !hideRoutes.some(route => this.currentRoute.startsWith(route));
  }
}
