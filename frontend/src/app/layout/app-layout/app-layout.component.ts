import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DossierApiService } from '../../services/dossier-api.service';
import { NotificationApiService } from '../../services/notification-api.service';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { OnboardingTourService } from '../../services/onboarding-tour.service';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { RouterOutlet, Router } from '@angular/router';
import { routeFadeSlideAnimation } from '../../animations/route-animations';

@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  animations: [routeFadeSlideAnimation]
})
export class AppLayoutComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatSidenav;

  isHandset$: Observable<boolean>;
  isMobile$: Observable<boolean>;
  userMenuOpen = false;
  notificationMenuOpen = false;
  isDarkTheme$: Observable<boolean>;
  dossiersPendingCount$: Observable<number>;
  unreadNotificationCount$: Observable<number>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    public themeService: ThemeService,
    private dossierApiService: DossierApiService,
    private notificationApiService: NotificationApiService,
    private keyboardShortcutService: KeyboardShortcutService,
    private onboardingTourService: OnboardingTourService,
    private router: Router
  ) {
    this.isHandset$ = this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(
        map(result => result.matches),
        shareReplay()
      );

    this.isMobile$ = this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(
        map(result => result.matches),
        shareReplay()
      );

    this.isDarkTheme$ = this.themeService.currentTheme$.pipe(
      map(theme => theme === 'dark')
    );

    this.dossiersPendingCount$ = this.dossierApiService.getPendingCount();
    this.unreadNotificationCount$ = this.notificationApiService.getUnreadCount();
  }

  ngOnInit(): void {
    this.isHandset$.subscribe(isHandset => {
      if (this.drawer) {
        if (isHandset) {
          this.drawer.mode = 'over';
          this.drawer.close();
        } else {
          this.drawer.mode = 'side';
          this.drawer.open();
        }
      }
    });
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  toggleNotificationMenu(): void {
    this.notificationMenuOpen = !this.notificationMenuOpen;
  }

  closeNotificationMenu(): void {
    this.notificationMenuOpen = false;
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }

  closeSidenavOnMobile(): void {
    this.isHandset$.subscribe(isHandset => {
      if (isHandset && this.drawer) {
        this.drawer.close();
      }
    }).unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  showKeyboardShortcuts(): void {
    this.keyboardShortcutService.toggleShortcutHelp();
  }

  startTour(tourId: 'dossier-creation' | 'dossier-detail' | 'message-creation' | 'workflow-status'): void {
    const currentUrl = this.router.url;
    
    if (tourId === 'dossier-creation' && !currentUrl.includes('/dossiers/create')) {
      this.router.navigate(['/dossiers/create']).then(() => {
        setTimeout(() => this.onboardingTourService.startManualTour(tourId), 500);
      });
    } else if (tourId === 'dossier-detail' && !currentUrl.match(/\/dossiers\/\d+/)) {
      return;
    } else {
      this.onboardingTourService.startManualTour(tourId);
    }
  }

  resetAllTours(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les guides interactifs ?')) {
      this.onboardingTourService.resetAllTours();
    }
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    this.keyboardShortcutService.handleKeyDown(event);
  }
}
