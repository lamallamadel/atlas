import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { of } from 'rxjs';

import { AppLayoutComponent } from './app-layout.component';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DossierApiService } from '../../services/dossier-api.service';
import { NotificationApiService } from '../../services/notification-api.service';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { OnboardingTourService } from '../../services/onboarding-tour.service';
import { TourDefinitionService } from '../../services/tour-definition.service';
import { MaterialTestingModule } from '../../testing/material-testing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-global-search-bar',
  template: '',
  standalone: true,
  imports: [RouterTestingModule, MaterialTestingModule],
})
class GlobalSearchBarStubComponent {}

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;
  let mockAuthService: AngularVitestPartialMock<AuthService>;
  let mockThemeService: AngularVitestPartialMock<ThemeService>;
  let mockBreakpointObserver: AngularVitestPartialMock<BreakpointObserver>;
  let mockKeyboardShortcutService: AngularVitestPartialMock<KeyboardShortcutService>;
  let mockOnboardingTourService: AngularVitestPartialMock<OnboardingTourService>;
  let mockTourDefinitionService: AngularVitestPartialMock<TourDefinitionService>;

  beforeEach(async () => {
    mockAuthService = {
      logout: vi.fn().mockName('AuthService.logout'),
    };
    mockThemeService = {
      toggleTheme: vi.fn().mockName('ThemeService.toggleTheme'),
      getCurrentTheme: vi.fn().mockName('ThemeService.getCurrentTheme'),
      currentTheme$: of('light'),
    };
    mockBreakpointObserver = {
      observe: vi.fn().mockName('BreakpointObserver.observe'),
    };
    mockBreakpointObserver.observe.mockReturnValue(
      of({ matches: false, breakpoints: {} })
    );

    mockKeyboardShortcutService = {
      handleKeyDown: vi.fn().mockName('KeyboardShortcutService.handleKeyDown'),
      toggleShortcutHelp: vi
        .fn()
        .mockName('KeyboardShortcutService.toggleShortcutHelp'),
      getPreferences: vi
        .fn()
        .mockName('KeyboardShortcutService.getPreferences'),
      getShortcutsByCategory: vi
        .fn()
        .mockName('KeyboardShortcutService.getShortcutsByCategory'),
      closeShortcutHelp: vi
        .fn()
        .mockName('KeyboardShortcutService.closeShortcutHelp'),
    };
    mockKeyboardShortcutService.getPreferences.mockReturnValue({
      keyboardShortcutsEnabled: true,
      showShortcutHints: true,
    });
    mockKeyboardShortcutService.getShortcutsByCategory.mockReturnValue([]);
    (mockKeyboardShortcutService as any).preferences$ = of({
      keyboardShortcutsEnabled: true,
      showShortcutHints: true,
    });
    (mockKeyboardShortcutService as any).shortcutHelpVisible$ = of(false);
    (mockKeyboardShortcutService as any).commandPaletteVisible$ = of(false);

    mockOnboardingTourService = {
      startManualTour: vi
        .fn()
        .mockName('OnboardingTourService.startManualTour'),
      resetAllTours: vi.fn().mockName('OnboardingTourService.resetAllTours'),
      isTourCompleted: vi
        .fn()
        .mockName('OnboardingTourService.isTourCompleted'),
      resetTour: vi.fn().mockName('OnboardingTourService.resetTour'),
    };
    mockOnboardingTourService.resetAllTours.mockImplementation(() => {});
    mockTourDefinitionService = {
      getCoreTours: vi.fn().mockName('TourDefinitionService.getCoreTours'),
      getTour: vi.fn().mockName('TourDefinitionService.getTour'),
    };
    mockTourDefinitionService.getCoreTours.mockReturnValue([]);

    const mockDossierApiService = {
      getPendingCount: vi.fn().mockName('DossierApiService.getPendingCount'),
    };
    mockDossierApiService.getPendingCount.mockReturnValue(of(0));
    const mockNotificationApiService = {
      getUnreadCount: vi.fn().mockName('NotificationApiService.getUnreadCount'),
      list: vi.fn().mockName('NotificationApiService.list'),
    };
    mockNotificationApiService.getUnreadCount.mockReturnValue(of(0));
    (mockNotificationApiService as any).unreadCount$ = of(0);
    mockNotificationApiService.list.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MaterialTestingModule,
        BrowserAnimationsModule,
        AppLayoutComponent,
        GlobalSearchBarStubComponent,
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: DossierApiService, useValue: mockDossierApiService },
        {
          provide: NotificationApiService,
          useValue: mockNotificationApiService,
        },
        {
          provide: KeyboardShortcutService,
          useValue: mockKeyboardShortcutService,
        },
        { provide: OnboardingTourService, useValue: mockOnboardingTourService },
        { provide: TourDefinitionService, useValue: mockTourDefinitionService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;

    // Mock the viewChild signal
    const drawerSpy = {
      close: vi.fn().mockName('MatSidenav.close'),
      open: vi.fn().mockName('MatSidenav.open'),
      toggle: vi.fn().mockName('MatSidenav.toggle'),
    };
    (component as any).drawer = signal(drawerSpy);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle user menu', () => {
    expect(component.userMenuOpen).toBe(false);
    component.toggleUserMenu();
    expect(component.userMenuOpen).toBe(true);
    component.toggleUserMenu();
    expect(component.userMenuOpen).toBe(false);
  });

  it('should close user menu', () => {
    component.userMenuOpen = true;
    component.closeUserMenu();
    expect(component.userMenuOpen).toBe(false);
  });

  it('should logout and close user menu', () => {
    component.userMenuOpen = true;
    component.logout();
    expect(component.userMenuOpen).toBe(false);
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should observe handset breakpoint', async () => {
    component.isHandset$.subscribe((isHandset) => {
      expect(isHandset).toBe(false);
    });
  });

  it('should observe mobile breakpoint', async () => {
    component.isMobile$.subscribe((isMobile) => {
      expect(isMobile).toBe(false);
    });
  });

  it('should close sidenav on mobile when closeSidenavOnMobile is called', () => {
    mockBreakpointObserver.observe.mockReturnValue(
      of({ matches: true, breakpoints: {} })
    );

    // Re-create component to pick up new observer value
    const testFixture = TestBed.createComponent(AppLayoutComponent);
    const testComponent = testFixture.componentInstance;
    const drawerSpy = {
      close: vi.fn().mockName('MatSidenav.close'),
      open: vi.fn().mockName('MatSidenav.open'),
      toggle: vi.fn().mockName('MatSidenav.toggle'),
    };
    (testComponent as any).drawer = signal(drawerSpy);

    testFixture.detectChanges();
    testComponent.closeSidenavOnMobile();

    expect(drawerSpy.close).toHaveBeenCalled();
  });

  it('should toggle theme when toggleTheme is called', () => {
    component.toggleTheme();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('should observe dark theme state', async () => {
    component.isDarkTheme$.subscribe((isDark) => {
      expect(isDark).toBe(false);
    });
  });
});
