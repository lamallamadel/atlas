import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { MatDialogModule } from '@angular/material/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FullCalendarModule } from '@fullcalendar/angular';
import { TaskCardComponent } from './task-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { OAuthService } from 'angular-oauth2-oidc';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { TaskApiService } from '../services/task-api.service';
import { AuthService } from '../services/auth.service';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatCardModule,
        MatCheckboxModule,
        BrowserAnimationsModule,
        FullCalendarModule,
        TaskListComponent,
        TaskCardComponent,
      ],
      providers: [
        {
          provide: MatSnackBar,
          useValue: {
            open: () => ({
              onAction: () => of(null),
              afterDismissed: () => of(null),
            }),
            dismiss: () => {},
          },
        },
        {
          provide: TaskApiService,
          useValue: { list: () => of({ content: [], totalElements: 0 }) },
        },
        { provide: AuthService, useValue: { getUserId: () => '' } },
        {
          provide: OAuthService,
          useValue: {
            initCodeFlow: vi.fn().mockName('OAuthService.initCodeFlow'),
            loadDiscoveryDocumentAndTryLogin: vi
              .fn()
              .mockName('OAuthService.loadDiscoveryDocumentAndTryLogin'),
            hasValidAccessToken: vi
              .fn()
              .mockName('OAuthService.hasValidAccessToken'),
            configure: vi.fn().mockName('OAuthService.configure'),
            setStorage: vi.fn().mockName('OAuthService.setStorage'),
            logOut: vi.fn().mockName('OAuthService.logOut'),
            getAccessToken: vi.fn().mockName('OAuthService.getAccessToken'),
          },
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
