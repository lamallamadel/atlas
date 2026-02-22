import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarViewComponent } from './calendar-view.component';
import { AppointmentApiService, AppointmentStatus, AppointmentResponse } from '../services/appointment-api.service';
import { ToastNotificationService } from '../services/toast-notification.service';
import { CalendarSyncService } from '../services/calendar-sync.service';
import { FullCalendarModule } from '@fullcalendar/angular';

describe('CalendarViewComponent', () => {
  let component: CalendarViewComponent;
  let fixture: ComponentFixture<CalendarViewComponent>;
  let appointmentService: jasmine.SpyObj<AppointmentApiService>;
  let toastService: jasmine.SpyObj<ToastNotificationService>;

  const mockAppointments: AppointmentResponse[] = [
    {
      id: 1,
      orgId: 'org1',
      dossierId: 100,
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
      location: 'Office A',
      assignedTo: 'John Doe',
      notes: 'Initial meeting',
      status: AppointmentStatus.SCHEDULED,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-10T08:00:00Z'
    },
    {
      id: 2,
      orgId: 'org1',
      dossierId: 101,
      startTime: '2024-01-15T14:00:00Z',
      endTime: '2024-01-15T15:00:00Z',
      location: 'Office B',
      assignedTo: 'Jane Smith',
      notes: 'Follow-up',
      status: AppointmentStatus.COMPLETED,
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-15T15:00:00Z'
    }
  ];

  beforeEach(async () => {
    const appointmentServiceSpy = jasmine.createSpyObj('AppointmentApiService', [
      'list',
      'getById',
      'create',
      'update',
      'delete'
    ]);
    const toastServiceSpy = jasmine.createSpyObj('ToastNotificationService', [
      'success',
      'error',
      'warning'
    ]);
    const calendarSyncServiceSpy = jasmine.createSpyObj('CalendarSyncService', ['downloadICalendar']);

    await TestBed.configureTestingModule({
      declarations: [CalendarViewComponent],
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        FullCalendarModule
      ],
      providers: [
        { provide: AppointmentApiService, useValue: appointmentServiceSpy },
        { provide: ToastNotificationService, useValue: toastServiceSpy },
        { provide: CalendarSyncService, useValue: calendarSyncServiceSpy }
      ]
    }).compileComponents();

    appointmentService = TestBed.inject(AppointmentApiService) as jasmine.SpyObj<AppointmentApiService>;
    toastService = TestBed.inject(ToastNotificationService) as jasmine.SpyObj<ToastNotificationService>;
  });

  beforeEach(() => {
    appointmentService.list.and.returnValue(of({
      content: mockAppointments,
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 20,
        paged: true,
        unpaged: false
      },
      last: true,
      totalPages: 1,
      totalElements: 2,
      size: 20,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 2,
      empty: false
    }));

    fixture = TestBed.createComponent(CalendarViewComponent);
    component = fixture.componentInstance;
    spyOn(component as any, 'loadCalendarPlugins').and.returnValue(Promise.resolve());
    component.calendarOptions.plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];
    component.calendarLoaded = true;
    component.calendarLoading = false;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    expect(appointmentService.list).toHaveBeenCalledWith({ size: 1000 });
    expect(component.appointments.length).toBe(2);
    expect(component.isLoading).toBe(false);
  }));

  it('should extract available assignees from appointments', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    expect(component.availableAssignees).toContain('John Doe');
    expect(component.availableAssignees).toContain('Jane Smith');
    expect(component.availableAssignees.length).toBe(2);
  }));

  it('should filter appointments by assignedTo', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    component.onFilterByAssignedToChange('John Doe');
    const events = component.calendarOptions.events as any[];
    expect(events.length).toBe(1);
    expect(events[0].extendedProps.assignedTo).toBe('John Doe');
  }));

  it('should filter appointments by status', () => {
    appointmentService.list.calls.reset();
    appointmentService.list.and.returnValue(of({
      content: [mockAppointments[0]],
      pageable: {
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        pageNumber: 0,
        pageSize: 20,
        paged: true,
        unpaged: false
      },
      last: true,
      totalPages: 1,
      totalElements: 1,
      size: 20,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      first: true,
      numberOfElements: 1,
      empty: false
    }));

    component.onFilterByStatusChange(AppointmentStatus.SCHEDULED);
    
    expect(appointmentService.list).toHaveBeenCalledWith({
      size: 1000,
      status: AppointmentStatus.SCHEDULED
    });
  });

  it('should get correct status color', () => {
    const scheduledColor = (component as any).getStatusColor(AppointmentStatus.SCHEDULED);
    const completedColor = (component as any).getStatusColor(AppointmentStatus.COMPLETED);
    const cancelledColor = (component as any).getStatusColor(AppointmentStatus.CANCELLED);
    
    expect(scheduledColor).toBe('#2196F3');
    expect(completedColor).toBe('#4CAF50');
    expect(cancelledColor).toBe('#9E9E9E');
  });

  it('should detect conflict between appointments', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    const start = new Date('2024-01-15T10:30:00Z');
    const end = new Date('2024-01-15T11:30:00Z');
    const hasConflict = (component as any).checkConflict(999, start, end, 'John Doe');
    expect(hasConflict).toBe(true);
  }));

  it('should not detect conflict for different assignees', () => {
    fixture.detectChanges();
    
    const start = new Date('2024-01-15T10:30:00Z');
    const end = new Date('2024-01-15T11:30:00Z');
    
    const hasConflict = (component as any).checkConflict(999, start, end, 'Other Person');
    
    expect(hasConflict).toBe(false);
  });

  it('should not detect conflict for cancelled appointments', () => {
    const cancelledAppointment: AppointmentResponse = {
      ...mockAppointments[0],
      status: AppointmentStatus.CANCELLED
    };
    component.appointments = [cancelledAppointment];
    
    const start = new Date('2024-01-15T10:30:00Z');
    const end = new Date('2024-01-15T11:30:00Z');
    
    const hasConflict = (component as any).checkConflict(999, start, end, 'John Doe');
    
    expect(hasConflict).toBe(false);
  });

  it('should create appointment', () => {
    const newAppointment: AppointmentResponse = {
      id: 3,
      orgId: 'org1',
      dossierId: 102,
      startTime: '2024-01-16T10:00:00Z',
      endTime: '2024-01-16T11:00:00Z',
      location: 'Office C',
      assignedTo: 'John Doe',
      notes: 'New appointment',
      status: AppointmentStatus.SCHEDULED,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z'
    };

    appointmentService.create.and.returnValue(of(newAppointment));
    fixture.detectChanges();

    const initialCount = component.appointments.length;
    
    component.createAppointment({
      dossierId: 102,
      startTime: '2024-01-16T10:00:00Z',
      endTime: '2024-01-16T11:00:00Z',
      location: 'Office C',
      assignedTo: 'John Doe',
      notes: 'New appointment',
      status: AppointmentStatus.SCHEDULED
    });

    expect(appointmentService.create).toHaveBeenCalled();
    expect(component.appointments.length).toBe(initialCount + 1);
    expect(toastService.success).toHaveBeenCalledWith('Rendez-vous créé avec succès');
  });

  it('should update appointment', () => {
    const updatedAppointment: AppointmentResponse = {
      ...mockAppointments[0],
      location: 'Updated Location'
    };

    appointmentService.update.and.returnValue(of(updatedAppointment));
    fixture.detectChanges();

    component.updateAppointment({
      id: 1,
      dossierId: 100,
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
      location: 'Updated Location',
      assignedTo: 'John Doe',
      status: AppointmentStatus.SCHEDULED
    });

    expect(appointmentService.update).toHaveBeenCalledWith(1, jasmine.any(Object));
    expect(toastService.success).toHaveBeenCalledWith('Rendez-vous mis à jour avec succès');
  });

  it('should handle error when loading appointments', fakeAsync(() => {
    appointmentService.list.and.returnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();
    tick(0);
    expect(toastService.error).toHaveBeenCalledWith('Erreur lors du chargement des rendez-vous');
    expect(component.isLoading).toBe(false);
  }));

  it('should export to iCal format', () => {
    fixture.detectChanges();
    
    spyOn(document, 'createElement').and.callThrough();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-url');
    spyOn(URL, 'revokeObjectURL');

    component.exportToICal();

    expect(toastService.success).toHaveBeenCalledWith('Calendrier exporté avec succès');
  });

  it('should generate iCal content correctly', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    component.appointments = [mockAppointments[0]];
    component.exportToICal();
    expect(toastService.success).toHaveBeenCalledWith('Calendrier exporté avec succès');
  }));

  it('should refresh calendar', () => {
    fixture.detectChanges();
    appointmentService.list.calls.reset();
    
    component.refreshCalendar();
    
    expect(appointmentService.list).toHaveBeenCalled();
  });
});
