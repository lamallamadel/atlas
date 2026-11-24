import { Component, OnInit, OnDestroy, HostListener, computed, inject, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { AuthService } from '../../services/auth.service';
import { isManagerOrAdmin } from '../../services/agency-role';
import { CoopApiService } from '../../services/coop-api.service';
import { ThemeService } from '../../services/theme.service';
import { DossierApiService } from '../../services/dossier-api.service';
import { NotificationApiService } from '../../services/notification-api.service';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { OnboardingTourService } from '../../services/onboarding-tour.service';
import { TourDefinitionService } from '../../services/tour-definition.service';
import { Observable, Subscription } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';
import { RouterOutlet, Router, RouterLink, RouterLinkActive, NavigationEnd, ChildrenOutletContexts } from '@angular/router';
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
import { AsyncPipe, CommonModule } from '@angular/common';

@Component({
    selector: 'app-layout',
    standalone: true,
    templateUrl: './app-layout.component.html',
    styleUrls: ['./app-layout.component.scss'],
    animations: [routeFadeSlideAnimation],
    imports: [
      CommonModule,
      KeyboardShortcutsComponent, 
      CommandPaletteComponent, 
      AiAgentPanelComponent, 
      RouterLink, 
      RouterLinkActive, 
      DsButtonComponent, 
      DsIconComponent, 
      GlobalSearchBarComponent, 
      ApiStatusIndicatorComponent, 
      NotificationCenterComponent, 
      MaintainScrollDirective, 
      RouterOutlet, 
      MobileBottomNavigationComponent,
      PwaInstallPromptComponent,
      AsyncPipe,
      CdkConnectedOverlay, 
      CdkOverlayOrigin
    ]
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  private readonly overlay = inject(Overlay);
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);
  /** Lien « Équipe » : manager et admin seulement (l'écran est aussi gardé par RoleGuard). */
  readonly canSeeTeam = isManagerOrAdmin(this.authService);
  /** Lien « Démos B2B » : seulement pour l'organisation qui reçoit les demandes de démo. */
  readonly hasB2bDemos = signal(false);
  /**
   * Lien « Coop » : module actif (sinon l'API répond 403) et, pour un agent, au moins un
   * groupement ; le manager et l'admin le voient pour créer le premier.
   */
  readonly hasCoop = signal(false);
  private coopApi = inject(CoopApiService);
  public themeService = inject(ThemeService);
  private dossierApiService = inject(DossierApiService);
  private notificationApiService = inject(NotificationApiService);
  private keyboardShortcutService = inject(KeyboardShortcutService);
  private onboardingTourService = inject(OnboardingTourService);
  private tourDefinitionService = inject(TourDefinitionService);
  private router = inject(Router);
  private contexts = inject(ChildrenOutletContexts);

  sidebarOpen = signal(true);
  mobileSidebarOpen = signal(false);
  private isHandset = signal(false);
  /** État que le bouton du menu bascule réellement : tiroir sur mobile, barre latérale sinon. */
  menuExpanded = computed(() => this.isHandset() ? this.mobileSidebarOpen() : this.sidebarOpen());

  helpPanelOpen = false;
  notificationMenuOpen = false;
  userMenuOpen = false;
  toursSubmenuOpen = false;

  readonly userMenuScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly notificationMenuScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly helpPanelScrollStrategy = this.overlay.scrollStrategies.reposition();

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

  private subscriptions = new Subscription();

  constructor() {
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
    this.subscriptions.add(
      this.isHandset$.subscribe(isHandset => {
        this.isHandset.set(isHandset);
        this.sidebarOpen.set(!isHandset);
        if (!isHandset) {
          this.mobileSidebarOpen.set(false);
        }
      })
    );

    this.subscriptions.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.mobileSidebarOpen.set(false);
        }
      })
    );
    
    this.updateTourProgress();

    this.subscriptions.add(
      this.dossierApiService.countByCaseType('CRM_LEAD_B2B_DEMO').subscribe({
        next: count => this.hasB2bDemos.set(count > 0),
        error: () => this.hasB2bDemos.set(false),
      })
    );
    this.subscriptions.add(
      this.coopApi.groupCount().subscribe({
        next: count => this.hasCoop.set(count > 0 || this.canSeeTeam),
        error: () => this.hasCoop.set(false),
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleSidebar(): void {
    this.isHandset$.pipe(take(1)).subscribe(isHandset => {
      if (isHandset) {
        this.mobileSidebarOpen.update(v => !v);
      } else {
        this.sidebarOpen.update(v => !v);
      }
    });
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  toggleUserMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const next = !this.userMenuOpen;
    this.closeAllMenus();
    if (next) {
      this.userMenuOpen = true;
    }
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
    this.toursSubmenuOpen = false;
  }

  toggleToursSubmenu(): void {
    this.toursSubmenuOpen = !this.toursSubmenuOpen;
  }

  toggleNotificationMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const next = !this.notificationMenuOpen;
    this.closeAllMenus();
    if (next) {
      this.notificationMenuOpen = true;
    }
  }

  closeNotificationMenu(): void {
    this.notificationMenuOpen = false;
  }

  closeAllMenus(): void {
    this.closeUserMenu();
    this.closeNotificationMenu();
    this.closeHelpPanel();
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }

  toggleTheme(): void {
    this.closeAllMenus();
    this.themeService.toggleTheme();
  }

  showKeyboardShortcuts(): void {
    this.closeAllMenus();
    this.keyboardShortcutService.toggleShortcutHelp();
  }

  toggleHelpPanel(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const next = !this.helpPanelOpen;
    this.closeAllMenus();
    if (next) {
      this.helpPanelOpen = true;
    }
  }

  closeHelpPanel(): void {
    this.helpPanelOpen = false;
  }

  startTourFromHelp(tourId: any): void {
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

  startTour(tourId: any): void {
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

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    this.keyboardShortcutService.handleKeyDown(event);
  }
}
