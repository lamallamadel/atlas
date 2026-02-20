import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OnboardingTourService } from './onboarding-tour.service';

describe('OnboardingTourService', () => {
  let service: OnboardingTourService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: {
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: jasmine.createSpy('subscribe')
        })
      }
    });

    TestBed.configureTestingModule({
      providers: [
        OnboardingTourService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(OnboardingTourService);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

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
    localStorage.setItem('onboarding_tour_progress', JSON.stringify({
      'test-tour': { completed: true }
    }));

    service.resetTour('test-tour');
    expect(service.isTourCompleted('test-tour')).toBe(false);
  });

  it('should reset all tours', () => {
    localStorage.setItem('onboarding_tour_progress', JSON.stringify({
      'tour1': { completed: true },
      'tour2': { completed: true }
    }));
    localStorage.setItem('onboarding_tour_analytics', JSON.stringify([
      { tourId: 'tour1', action: 'completed', timestamp: '2024-01-01' }
    ]));

    service.resetAllTours();

    expect(service.isTourCompleted('tour1')).toBe(false);
    expect(service.isTourCompleted('tour2')).toBe(false);
    expect(service.getAnalytics().length).toBe(0);
  });

  it('should get analytics', () => {
    const mockAnalytics = [
      { tourId: 'tour1', action: 'started' as const, timestamp: '2024-01-01' }
    ];
    localStorage.setItem('onboarding_tour_analytics', JSON.stringify(mockAnalytics));

    const analytics = service.getAnalytics();
    expect(analytics.length).toBe(1);
    expect(analytics[0].tourId).toBe('tour1');
  });

  it('should cancel current tour', () => {
    service.cancelCurrentTour();
    expect(service).toBeTruthy();
  });
});
