import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { of } from 'rxjs';

import { AppLayoutComponent } from './app-layout.component';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { MaterialTestingModule } from '../../testing/material-testing.module';

@Component({ selector: 'app-global-search-bar', template: '' })
class GlobalSearchBarStubComponent { }

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout']);
    mockThemeService = jasmine.createSpyObj('ThemeService', ['toggleTheme', 'getCurrentTheme'], {
      currentTheme$: of('light')
    });
    mockBreakpointObserver = jasmine.createSpyObj('BreakpointObserver', ['observe']);
    mockBreakpointObserver.observe.and.returnValue(of({ matches: false, breakpoints: {} }));

    await TestBed.configureTestingModule({
      declarations: [AppLayoutComponent, GlobalSearchBarStubComponent],
      imports: [RouterTestingModule, MaterialTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;
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

  it('should close sidenav on mobile when closeSidenavOnMobile is called', async () => {
    component.drawer = jasmine.createSpyObj<MatSidenav>('MatSidenav', ['close', 'open', 'toggle']);
    mockBreakpointObserver.observe.and.returnValue(of({ matches: true, breakpoints: {} }));
    
    component.closeSidenavOnMobile();
    await fixture.whenStable();
    
    expect(component.drawer.close).toHaveBeenCalled();
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
