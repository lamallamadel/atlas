import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AppComponent } from './app.component';
import { ThemeService } from './services/theme.service';
import { ServiceWorkerRegistrationService } from './services/service-worker-registration.service';
import { OfflineQueueService } from './services/offline-queue.service';
import { LiveAnnouncerService } from './services/live-announcer.service';
import { PrefetchService } from './services/prefetch.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const mockThemeService = jasmine.createSpyObj('ThemeService', ['getCurrentTheme']);
    const mockSwService = jasmine.createSpyObj('ServiceWorkerRegistrationService', ['register']);
    const mockQueueService = jasmine.createSpyObj('OfflineQueueService', ['processQueue']);
    const mockLiveAnnouncer = jasmine.createSpyObj('LiveAnnouncerService', ['announce']);
    const mockPrefetchService = jasmine.createSpyObj('PrefetchService', ['init']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: ServiceWorkerRegistrationService, useValue: mockSwService },
        { provide: OfflineQueueService, useValue: mockQueueService },
        { provide: LiveAnnouncerService, useValue: mockLiveAnnouncer },
        { provide: PrefetchService, useValue: mockPrefetchService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'frontend'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('frontend');
  });
});
