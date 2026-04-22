import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { of } from "rxjs";

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
    imports: [RouterTestingModule, MaterialTestingModule]
})
class GlobalSearchBarStubComponent { }

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;
  let mockKeyboardShortcutService: jasmine.SpyObj<KeyboardShortcutService>;
  let mockOnboardingTourService: jasmine.SpyObj<OnboardingTourService>;
  let mockTourDefinitionService: jasmine.SpyObj<TourDefinitionService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout']);
    mockThemeService = jasmine.createSpyObj('ThemeService', ['toggleTheme', 'getCurrentTheme'], {
      currentTheme$: of('light')
    });
    mockBreakpointObserver = jasmine.createSpyObj('BreakpointObserver', ['observe']);
    mockBreakpointObserver.observe.and.returnValue(of({ matches: false, breakpoints: {} }));

    mockKeyboardShortcutService = jasmine.createSpyObj('KeyboardShortcutService', [
      'handleKeyDown', 'toggleShortcutHelp', 'getPreferences', 'getShortcutsByCategory', 'closeShortcutHelp'
    ]);
    mockKeyboardShortcutService.getPreferences.and.returnValue({
      keyboardShortcutsEnabled: true,
      showShortcutHints: true
    });
    mockKeyboardShortcutService.getShortcutsByCategory.and.returnValue([]);
    (mockKeyboardShortcutService as any).preferences$ = of({
      keyboardShortcutsEnabled: true,
      showShortcutHints: true
    });
    (mockKeyboardShortcutService as any).shortcutHelpVisible$ = of(false);
    (mockKeyboardShortcutService as any).commandPaletteVisible$ = of(false);

    mockOnboardingTourService = jasmine.createSpyObj('OnboardingTourService', ['startManualTour', 'resetAllTours', 'isTourCompleted', 'resetTour']);
    mockOnboardingTourService.resetAllTours.and.stub();
    mockTourDefinitionService = jasmine.createSpyObj('TourDefinitionService', ['getCoreTours', 'getTour']);
    mockTourDefinitionService.getCoreTours.and.returnValue([]);

    const mockDossierApiService = jasmine.createSpyObj('DossierApiService', ['getPendingCount']);
    mockDossierApiService.getPendingCount.and.returnValue(of(0));
    const mockNotificationApiService = jasmine.createSpyObj('NotificationApiService', ['getUnreadCount', 'list']);
    mockNotificationApiService.getUnreadCount.and.returnValue(of(0));
    (mockNotificationApiService as any).unreadCount$ = of(0);
    mockNotificationApiService.list.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, 
        MaterialTestingModule, 
        BrowserAnimationsModule,
        AppLayoutComponent, 
        GlobalSearchBarStubComponent
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: DossierApiService, useValue: mockDossierApiService },
        { provide: NotificationApiService, useValue: mockNotificationApiService },
        { provide: KeyboardShortcutService, useValue: mockKeyboardShortcutService },
        { provide: OnboardingTourService, useValue: mockOnboardingTourService },
        { provide: TourDefinitionService, useValue: mockTourDefinitionService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;
    
    // Mock the viewChild signal
    const drawerSpy = jasmine.createSpyObj<MatSidenav>('MatSidenav', ['close', 'open', 'toggle']);
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

  it('should observe handset breakpoint', (done) => {
    component.isHandset$.subscribe(isHandset => {
      expect(isHandset).toBe(false);
      done();
    });
  });

  it('should observe mobile breakpoint', (done) => {
    component.isMobile$.subscribe(isMobile => {
      expect(isMobile).toBe(false);
      done();
    });
  });

  it('should close sidenav on mobile when closeSidenavOnMobile is called', () => {
    mockBreakpointObserver.observe.and.returnValue(of({ matches: true, breakpoints: {} }));
    
    // Re-create component to pick up new observer value
    const testFixture = TestBed.createComponent(AppLayoutComponent);
    const testComponent = testFixture.componentInstance;
    const drawerSpy = jasmine.createSpyObj<MatSidenav>('MatSidenav', ['close', 'open', 'toggle']);
    (testComponent as any).drawer = signal(drawerSpy);

    testFixture.detectChanges();
    testComponent.closeSidenavOnMobile();

    expect(drawerSpy.close).toHaveBeenCalled();
  });

  it('should toggle theme when toggleTheme is called', () => {
    component.toggleTheme();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('should observe dark theme state', (done) => {
    component.isDarkTheme$.subscribe(isDark => {
      expect(isDark).toBe(false);
      done();
    });
  });
});
