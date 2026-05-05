import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { OnboardingTourService } from './onboarding-tour.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('OnboardingTourService', () => {
  let service: OnboardingTourService;
  let mockRouter: AngularVitestPartialMock<Router>;

  beforeEach(() => {
    const routerSpy = {
      navigate: vi.fn().mockName('Router.navigate'),
      events: {
        pipe: vi.fn().mockReturnValue({
          subscribe: vi.fn(),
        }),
      },
    };
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

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        OnboardingTourService,
        { provide: Router, useValue: routerSpy },
        { provide: OAuthService, useValue: mockOAuthService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(OnboardingTourService);
    mockRouter = TestBed.inject(Router) as AngularVitestPartialMock<Router>;

    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check isTourCompleted returns false for unknown tours', () => {
    expect(service.isTourCompleted('test-tour')).toBe(false);
  });

  it('should check if tour is completed', () => {
    expect(service.isTourCompleted('non-existent')).toBe(false);
  });

  it('should reset specific tour', () => {
    localStorage.setItem(
      'onboarding_tour_progress',
      JSON.stringify({
        'test-tour': { completed: true },
      })
    );

    service.resetTour('test-tour');
    expect(service.isTourCompleted('test-tour')).toBe(false);
  });

  it('should reset all tours', () => {
    localStorage.setItem(
      'onboarding_tour_progress',
      JSON.stringify({
        tour1: { completed: true },
        tour2: { completed: true },
      })
    );
    localStorage.setItem(
      'onboarding_tour_analytics',
      JSON.stringify([
        { tourId: 'tour1', action: 'completed', timestamp: '2024-01-01' },
      ])
    );

    service.resetAllTours();

    expect(service.isTourCompleted('tour1')).toBe(false);
    expect(service.isTourCompleted('tour2')).toBe(false);
    expect(service.getAnalytics().length).toBe(0);
  });

  it('should get analytics', () => {
    const mockAnalytics = [
      { tourId: 'tour1', action: 'started' as const, timestamp: '2024-01-01' },
    ];
    localStorage.setItem(
      'onboarding_tour_analytics',
      JSON.stringify(mockAnalytics)
    );

    const analytics = service.getAnalytics();
    expect(analytics.length).toBe(1);
    expect(analytics[0].tourId).toBe('tour1');
  });

  it('should cancel current tour', () => {
    service.cancelCurrentTour();
    expect(service).toBeTruthy();
  });
});
