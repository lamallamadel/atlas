import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FullCalendarModule } from '@fullcalendar/angular';
import { EmptyStateComponent } from './empty-state.component';
import { TaskCardComponent } from './task-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { OAuthService } from 'angular-oauth2-oidc';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ 
        TaskListComponent,
        EmptyStateComponent,
        TaskCardComponent
      ],
      imports: [
        FormsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatCheckboxModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        FullCalendarModule
      ],
      providers: [
        { provide: OAuthService, useValue: jasmine.createSpyObj('OAuthService', ['initCodeFlow', 'loadDiscoveryDocumentAndTryLogin', 'hasValidAccessToken', 'configure', 'setStorage', 'logOut', 'getAccessToken']) }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
