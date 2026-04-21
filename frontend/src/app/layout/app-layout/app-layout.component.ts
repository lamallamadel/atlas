import { Component, OnInit, HostListener, viewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DossierApiService } from '../../services/dossier-api.service';
import { NotificationApiService } from '../../services/notification-api.service';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { OnboardingTourService } from '../../services/onboarding-tour.service';
import { TourDefinitionService } from '../../services/tour-definition.service';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { routeFadeSlideAnimation } from '../../animations/route-animations';
import { KeyboardShortcutsComponent } from '../../components/keyboard-shortcuts.component';
import { CommandPaletteComponent } from '../../components/command-palette.component';
import { AiAgentPanelComponent } from '../../components/ai-agent-panel.component';
import { MatToolbar } from '@angular/material/toolbar';
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle, MatDivider } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { GlobalSearchBarComponent } from '../../components/global-search-bar.component';
import { ApiStatusIndicatorComponent } from '../../components/api-status-indicator.component';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatBadge } from '@angular/material/badge';
import { NotificationCenterComponent } from '../../components/notification-center.component';
import { MaintainScrollDirective } from '../../directives/maintain-scroll.directive';
import { MobileBottomNavigationComponent } from '../../components/mobile-bottom-navigation.component';
import { PwaInstallPromptComponent } from '../../components/pwa-install-prompt.component';
import { AppShellComponent } from '../../components/app-shell.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-layout',
    templateUrl: './app-layout.component.html',
    styleUrls: ['./app-layout.component.scss'],
    animations: [routeFadeSlideAnimation],
    imports: [KeyboardShortcutsComponent, CommandPaletteComponent, AiAgentPanelComponent, MatSidenavContainer, MatSidenav, MatToolbar, MatNavList, MatListItem, RouterLink, RouterLinkActive, MatTooltip, MatIcon, MatListItemIcon, MatListItemTitle, MatDivider, MatSidenavContent, MatIconButton, GlobalSearchBarComponent, ApiStatusIndicatorComponent, MatMenuTrigger, MatBadge, MatMenu, NotificationCenterComponent, MatMenuItem, MaintainScrollDirective, RouterOutlet, MobileBottomNavigationComponent, PwaInstallPromptComponent, AppShellComponent, AsyncPipe]
})
export class AppLayoutComponent implements OnInit {
  readonly drawer = viewChild.required<MatSidenav>('drawer');

  isHandset$: Observable<boolean>;
  isMobile$: Observable<boolean>;
  userMenuOpen = false;
  notificationMenuOpen = false;
  isDarkTheme$: Observable<boolean>;
  dossiersPendingCount$: Observable<number>;
  unreadNotificationCount$: Observable<number>;
  tourCompletionPercentage = 0;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    public themeService: ThemeService,
    private dossierApiService: DossierApiService,
    private notificationApiService: NotificationApiService,
    private keyboardShortcutService: KeyboardShortcutService,
    private onboardingTourService: OnboardingTourService,
    private tourDefinitionService: TourDefinitionService,
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
      const drawer = this.drawer();
      if (drawer) {
        if (isHandset) {
          drawer.mode = 'over';
          drawer.close();
        } else {
          drawer.mode = 'side';
          drawer.open();
        }
      }
    });
    
    this.updateTourProgress();
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
      const drawer = this.drawer();
      if (isHandset && drawer) {
        drawer.close();
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
      this.updateTourProgress();
    }
  }

  isTourCompleted(tourId: string): boolean {
    return this.onboardingTourService.isTourCompleted(tourId);
  }

  updateTourProgress(): void {
    const tours = this.tourDefinitionService.getCoreTours();
    const completedCount = tours.filter(tour => this.isTourCompleted(tour.id)).length;
    this.tourCompletionPercentage = tours.length > 0 
      ? Math.round((completedCount / tours.length) * 100)
      : 0;
  }

  startQuickTour(tourId: string): void {
    const tour = this.tourDefinitionService.getTour(tourId);
    if (!tour) {
      return;
    }

    if (tour.requiredRoute && !this.router.url.includes(tour.requiredRoute)) {
      this.router.navigate([tour.requiredRoute]).then(() => {
        setTimeout(() => {
          this.onboardingTourService.startManualTour(tourId as any);
        }, 500);
      });
    } else {
      this.onboardingTourService.startManualTour(tourId as any);
    }
  }

  viewAllTours(): void {
    this.router.navigate(['/tours']);
  }

  skipAllTours(): void {
    if (confirm('Êtes-vous sûr de vouloir ignorer tous les guides interactifs ?')) {
      const tours = this.tourDefinitionService.getCoreTours();
      tours.forEach(tour => {
        this.onboardingTourService.resetTour(tour.id);
      });
      this.updateTourProgress();
    }
  }

  restartAllTours(): void {
    if (confirm('Êtes-vous sûr de vouloir redémarrer tous les guides interactifs ?')) {
      this.onboardingTourService.resetAllTours();
      this.updateTourProgress();
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
