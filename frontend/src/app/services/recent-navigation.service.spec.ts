import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { RecentNavigationService } from './recent-navigation.service';

describe('RecentNavigationService', () => {
  let service: RecentNavigationService;
  let routerEventsSubject: Subject<any>;

  beforeEach(() => {
    routerEventsSubject = new Subject();
    
    const routerMock = {
      events: routerEventsSubject.asObservable(),
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      providers: [
        RecentNavigationService,
        { provide: Router, useValue: routerMock }
      ]
    });
    
    localStorage.clear();
    service = TestBed.inject(RecentNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add recent item', () => {
    service.addRecentItem({
      id: '1',
      type: 'dossier',
      title: 'Test Dossier',
      route: '/dossiers/1'
    });

    const items = service.getRecentItems();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('1');
    expect(items[0].title).toBe('Test Dossier');
  });

  it('should not exceed max items', () => {
    for (let i = 0; i < 15; i++) {
      service.addRecentItem({
        id: `${i}`,
        type: 'dossier',
        title: `Dossier ${i}`,
        route: `/dossiers/${i}`
      });
    }

    const items = service.getRecentItems();
    expect(items.length).toBeLessThanOrEqual(10);
  });

  it('should remove duplicate entries', () => {
    service.addRecentItem({
      id: '1',
      type: 'dossier',
      title: 'Test Dossier',
      route: '/dossiers/1'
    });

    service.addRecentItem({
      id: '1',
      type: 'dossier',
      title: 'Test Dossier Updated',
      route: '/dossiers/1'
    });

    const items = service.getRecentItems();
    expect(items.length).toBe(1);
    expect(items[0].title).toBe('Test Dossier Updated');
  });

  it('should persist to localStorage', () => {
    service.addRecentItem({
      id: '1',
      type: 'dossier',
      title: 'Test Dossier',
      route: '/dossiers/1'
    });

    const stored = localStorage.getItem('recent_navigation');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].id).toBe('1');
  });

  it('should clear recent items', () => {
    service.addRecentItem({
      id: '1',
      type: 'dossier',
      title: 'Test Dossier',
      route: '/dossiers/1'
    });

    service.clearRecentItems();
    
    const items = service.getRecentItems();
    expect(items.length).toBe(0);
    expect(localStorage.getItem('recent_navigation')).toBeNull();
  });
});
