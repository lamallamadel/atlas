import { TestBed, fakeAsync, tick } from '@angular/core/testing';
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
      navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true))
    };

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: Router, useValue: mockRouter }
      ]
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

  it('should save and restore scroll position', fakeAsync(() => {
    const scrollToSpy = spyOn(window, 'scrollTo');
    
    service.saveScrollPosition('/test-route');
    service.restoreScrollPosition('/test-route');
    
    tick(0); // flush setTimeout(0) used in restoreScrollPosition
    expect(scrollToSpy).toHaveBeenCalled();
  }));

  it('should navigate back with correct animation', (done) => {
    routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    routerEventsSubject.next(new NavigationEnd(2, '/reports', '/reports'));
    
    service.navigateBack();
    
    setTimeout(() => {
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
      done();
    }, 100);
  });

  it('should navigate forward with correct animation', (done) => {
    routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    routerEventsSubject.next(new NavigationEnd(2, '/reports', '/reports'));
    
    service.navigateBack();
    
    setTimeout(() => {
      service.navigateForward();
      setTimeout(() => {
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/reports');
        done();
      }, 100);
    }, 100);
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

  it('should correctly report canGoForward', (done) => {
    routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    routerEventsSubject.next(new NavigationEnd(2, '/reports', '/reports'));
    
    expect(service.canGoForward()).toBeFalsy();
    
    service.navigateBack();
    
    setTimeout(() => {
      expect(service.canGoForward()).toBeTruthy();
      done();
    }, 100);
  });
});
