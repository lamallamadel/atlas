import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { MatDialogModule } from '@angular/material/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TaskCardComponent } from './task-card.component';
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
        BrowserAnimationsModule,
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
            initCodeFlow: (): void => {},
            loadDiscoveryDocumentAndTryLogin: (): void => {},
            hasValidAccessToken: (): boolean => false,
            configure: (): void => {},
            setStorage: (): void => {},
            logOut: (): void => {},
            getAccessToken: (): string => '',
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
