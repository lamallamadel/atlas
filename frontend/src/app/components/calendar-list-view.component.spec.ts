import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { LayoutModule } from '@angular/cdk/layout';
import { CalendarListViewComponent } from './calendar-list-view.component';
import { AppointmentApiService } from '../services/appointment-api.service';
import { ToastNotificationService } from '../services/toast-notification.service';
import { of } from "rxjs";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CalendarListViewComponent', () => {
  let component: CalendarListViewComponent;
  let fixture: ComponentFixture<CalendarListViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatDialogModule,
        MatIconModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatButtonModule,
        LayoutModule, CalendarListViewComponent],
    providers: [
        {
            provide: AppointmentApiService,
            useValue: {
                list: jasmine.createSpy('list').and.returnValue(of({ content: [], totalElements: 0 }))
            }
        },
        {
            provide: ToastNotificationService,
            useValue: {
                error: jasmine.createSpy('error'),
                success: jasmine.createSpy('success')
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(CalendarListViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments on init', () => {
    expect(component.appointments).toBeDefined();
  });
});
