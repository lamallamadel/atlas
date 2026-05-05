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
    const mockThemeService = {
      getCurrentTheme: vi.fn().mockName('ThemeService.getCurrentTheme'),
    };
    const mockSwService = {
      register: vi.fn().mockName('ServiceWorkerRegistrationService.register'),
    };
    const mockQueueService = {
      processQueue: vi.fn().mockName('OfflineQueueService.processQueue'),
    };
    const mockLiveAnnouncer = {
      announce: vi.fn().mockName('LiveAnnouncerService.announce'),
    };
    const mockPrefetchService = {
      init: vi.fn().mockName('PrefetchService.init'),
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent],
      declarations: [],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: ServiceWorkerRegistrationService, useValue: mockSwService },
        { provide: OfflineQueueService, useValue: mockQueueService },
        { provide: LiveAnnouncerService, useValue: mockLiveAnnouncer },
        { provide: PrefetchService, useValue: mockPrefetchService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Atlasia Pro'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Atlasia Pro');
  });
});
