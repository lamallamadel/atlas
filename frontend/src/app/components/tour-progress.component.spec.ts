import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { OAuthService } from 'angular-oauth2-oidc';

import { TourProgressComponent } from './tour-progress.component';
import { TourDefinitionService } from '../services/tour-definition.service';
import { OnboardingTourService } from '../services/onboarding-tour.service';
import { UserPreferencesService } from '../services/user-preferences.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('TourProgressComponent', () => {
  let component: TourProgressComponent;
  let fixture: ComponentFixture<TourProgressComponent>;

  beforeEach(async () => {
    const mockOAuthService = {
      initCodeFlow: vi.fn().mockName('OAuthService.initCodeFlow'),
      loadDiscoveryDocumentAndTryLogin: vi
        .fn()
        .mockName('OAuthService.loadDiscoveryDocumentAndTryLogin'),
      hasValidAccessToken: vi.fn().mockName('OAuthService.hasValidAccessToken'),
      configure: vi.fn().mockName('OAuthService.configure'),
      setStorage: vi.fn().mockName('OAuthService.setStorage'),
      logOut: vi.fn().mockName('OAuthService.logOut'),
      getAccessToken: vi.fn().mockName('OAuthService.getAccessToken'),
    };
    await TestBed.configureTestingModule({
      imports: [
        TourProgressComponent,
        RouterTestingModule,
        MatIconModule,
        MatProgressBarModule,
        MatButtonModule,
        MatChipsModule,
      ],
      providers: [
        TourDefinitionService,
        OnboardingTourService,
        UserPreferencesService,
        { provide: OAuthService, useValue: mockOAuthService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TourProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tours on init', () => {
    expect(component.tours.length).toBeGreaterThan(0);
  });

  it('should calculate completion percentage', () => {
    expect(component.completionPercentage).toBeGreaterThanOrEqual(0);
    expect(component.completionPercentage).toBeLessThanOrEqual(100);
  });
});
