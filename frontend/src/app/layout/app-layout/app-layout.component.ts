import { Component, OnInit, HostListener, viewChild, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
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
import { DsButtonComponent, DsIconComponent } from '../../design-system';
import { GlobalSearchBarComponent } from '../../components/global-search-bar.component';
import { ApiStatusIndicatorComponent } from '../../components/api-status-indicator.component';
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
    imports: [KeyboardShortcutsComponent, CommandPaletteComponent, AiAgentPanelComponent, MatSidenavContainer, MatSidenav, RouterLink, RouterLinkActive, MatSidenavContent, DsButtonComponent, DsIconComponent, GlobalSearchBarComponent, ApiStatusIndicatorComponent, NotificationCenterComponent, MaintainScrollDirective, RouterOutlet, MobileBottomNavigationComponent, PwaInstallPromptComponent, AppShellComponent, AsyncPipe, CdkConnectedOverlay, CdkOverlayOrigin]
})
export class AppLayoutComponent implements OnInit {
  private readonly overlay = inject(Overlay);

  readonly drawer = viewChild.required<MatSidenav>('drawer');

  /** Panneau « Aide » (remplace `mat-menu` pour cette entrée). */
  helpPanelOpen = false;
  /** Panneaux toolbar (notifications, utilisateur, sous-menu guides). */
  notificationMenuOpen = false;
  userMenuOpen = false;
  /** Sous-menu « Guides interactifs » (overlay latéral, sans backdrop). */
  toursSubmenuOpen = false;

  readonly toolbarDropdownScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly toolbarDropdownPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 }
  ];
  isHandset$: Observable<boolean>;
  isMobile$: Observable<boolean>;
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
    const next = !this.userMenuOpen;
    if (next) {
      this.closeHelpPanel();
      this.closeNotificationMenu();
    } else {
      this.toursSubmenuOpen = false;
    }
    this.userMenuOpen = next;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
    this.toursSubmenuOpen = false;
  }

  toggleToursSubmenu(): void {
    this.toursSubmenuOpen = !this.toursSubmenuOpen;
  }

  toggleNotificationMenu(): void {
    const next = !this.notificationMenuOpen;
    if (next) {
      this.closeHelpPanel();
      this.closeUserMenu();
    }
    this.notificationMenuOpen = next;
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

  toggleHelpPanel(): void {
    const next = !this.helpPanelOpen;
    if (next) {
      this.closeNotificationMenu();
      this.closeUserMenu();
    }
    this.helpPanelOpen = next;
  }

  closeHelpPanel(): void {
    this.helpPanelOpen = false;
  }

  startTourFromHelp(tourId: 'dossier-creation' | 'dossier-detail' | 'message-creation' | 'workflow-status'): void {
    this.closeHelpPanel();
    this.startTour(tourId);
  }

  resetAllToursFromHelp(): void {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les guides interactifs ?')) {
      return;
    }
    this.onboardingTourService.resetAllTours();
    this.updateTourProgress();
    this.closeHelpPanel();
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

    this.closeUserMenu();
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
