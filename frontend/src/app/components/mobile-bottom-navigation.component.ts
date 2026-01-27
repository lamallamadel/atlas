import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-mobile-bottom-navigation',
  template: `
    <nav class="mobile-bottom-nav" *ngIf="shouldShowNav" role="navigation" aria-label="Navigation principale mobile">
      <button
        *ngFor="let item of navItems"
        class="nav-item"
        [class.active]="isActive(item.route)"
        (click)="navigate(item.route)"
        [attr.aria-label]="item.label"
        [attr.aria-current]="isActive(item.route) ? 'page' : null"
        type="button">
        <div class="nav-icon-wrapper">
          <mat-icon [attr.aria-hidden]="true">{{ item.icon }}</mat-icon>
          <span class="badge" *ngIf="item.badge && item.badge > 0" [attr.aria-label]="item.badge + ' notifications'">
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </nav>
  `,
  styles: [`
    .mobile-bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--color-neutral-0, #ffffff);
      border-top: 1px solid var(--color-neutral-200, #e0e0e0);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
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
      padding: 8px 4px;
      border: none;
      background: transparent;
      color: var(--color-neutral-600, #757575);
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
      color: var(--color-primary-600, #2c5aa0);
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 32px;
      height: 3px;
      background: var(--color-primary-600, #2c5aa0);
      border-radius: 0 0 3px 3px;
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
      background: var(--color-error-500, #f44336);
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
      line-height: 1.2;
    }

    /* Dark theme */
    .dark-theme .mobile-bottom-nav {
      background: var(--color-neutral-900, #212121);
      border-top-color: var(--color-neutral-700, #616161);
    }

    .dark-theme .nav-item {
      color: var(--color-neutral-400, #bdbdbd);
    }

    .dark-theme .nav-item.active {
      color: var(--color-primary-400, #4288ce);
    }

    .dark-theme .nav-item.active::before {
      background: var(--color-primary-400, #4288ce);
    }

    /* Safe area support for notched devices */
    @supports (padding: env(safe-area-inset-bottom)) {
      .mobile-bottom-nav {
        padding-bottom: calc(8px + env(safe-area-inset-bottom));
      }
    }
  `]
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
