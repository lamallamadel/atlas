import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { NavigationService } from './navigation.service';
import { Subject } from 'rxjs';

describe('NavigationService', () => {
  let service: NavigationService;
  let routerEventsSubject: Subject<any>;
  let mockRouter: any;

  beforeEach(() => {
    routerEventsSubject = new Subject();
    mockRouter = {
      events: routerEventsSubject.asObservable(),
      url: '/test',
      navigateByUrl: vi.fn().mockReturnValue(Promise.resolve(true)),
    };

    TestBed.configureTestingModule({
      providers: [NavigationService, { provide: Router, useValue: mockRouter }],
    });
    service = TestBed.inject(NavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update navigation history on NavigationEnd', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    expect(service.canGoBack()).toBeFalsy();

    routerEventsSubject.next(new NavigationEnd(2, '/reports', '/reports'));
    expect(service.canGoBack()).toBeTruthy();
  });

  it('should return fadeIn animation by default', () => {
    expect(service.getRouteAnimation()).toBe('fadeIn');
  });

  it('should save and restore scroll position', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo');

    service.saveScrollPosition('/test-route');
    service.restoreScrollPosition('/test-route');

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('should navigate back with correct animation', async () => {
    routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    routerEventsSubject.next(new NavigationEnd(2, '/reports', '/reports'));

    service.navigateBack();

    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should navigate forward with correct animation', async () => {
    routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    routerEventsSubject.next(new NavigationEnd(2, '/reports', '/reports'));

    service.navigateBack();

    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    service.navigateForward();
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/reports');
  });

  it('should not navigate back when at start of history', () => {
    service.navigateBack();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should not navigate forward when at end of history', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    service.navigateForward();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should correctly report canGoBack', () => {
    expect(service.canGoBack()).toBeFalsy();

    routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    expect(service.canGoBack()).toBeFalsy();

    routerEventsSubject.next(new NavigationEnd(2, '/reports', '/reports'));
    expect(service.canGoBack()).toBeTruthy();
  });

  it('should correctly report canGoForward', async () => {
    routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    routerEventsSubject.next(new NavigationEnd(2, '/reports', '/reports'));

    expect(service.canGoForward()).toBeFalsy();

    service.navigateBack();

    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    expect(service.canGoForward()).toBeTruthy();
  });
});
