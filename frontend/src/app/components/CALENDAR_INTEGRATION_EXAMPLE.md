# Calendar View Integration Examples

## Example 1: Standalone Calendar Page

The calendar view is accessible via the route `/calendar` and provides a comprehensive view of all appointments.

### Usage

Simply navigate to the calendar page:

```html
<a routerLink="/calendar">Voir le calendrier</a>
```

Or use the keyboard shortcut: `g` then `c`

## Example 2: Embedded in Dossier Detail Page

You can embed the calendar view filtered by a specific dossier ID. Here's how to modify the appointment tab in the dossier detail page:

### Component TypeScript

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { AppointmentApiService, AppointmentResponse } from '../services/appointment-api.service';
import { CalendarOptions } from '@fullcalendar/core';

@Component({
  selector: 'app-dossier-appointments-tab',
  templateUrl: './dossier-appointments-tab.component.html',
  styleUrls: ['./dossier-appointments-tab.component.css']
})
export class DossierAppointmentsTabComponent implements OnInit {
  @Input() dossierId!: number;
  
  appointments: AppointmentResponse[] = [];
  calendarOptions: CalendarOptions = {
    // ... calendar configuration
  };

  constructor(private appointmentService: AppointmentApiService) {}

  ngOnInit(): void {
    this.loadDossierAppointments();
  }

  loadDossierAppointments(): void {
    this.appointmentService.list({ dossierId: this.dossierId, size: 1000 })
      .subscribe(response => {
        this.appointments = response.content;
        this.updateCalendarEvents();
      });
  }

  updateCalendarEvents(): void {
    this.calendarOptions.events = this.appointments.map(apt => ({
      id: apt.id.toString(),
      title: `RDV - ${apt.assignedTo || 'Non assigné'}`,
      start: apt.startTime,
      end: apt.endTime,
      backgroundColor: this.getStatusColor(apt.status),
      extendedProps: { appointment: apt }
    }));
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'SCHEDULED': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#9E9E9E';
      default: return '#757575';
    }
  }

  openFullCalendar(): void {
    // Navigate to full calendar view with pre-filter
    this.router.navigate(['/calendar'], { 
      queryParams: { dossierId: this.dossierId } 
    });
  }
}
```

### Component HTML

```html
<div class="appointments-tab">
  <div class="tab-header">
    <h3>Rendez-vous</h3>
    <button mat-raised-button color="primary" (click)="openFullCalendar()">
      <mat-icon>calendar_today</mat-icon>
      Voir calendrier complet
    </button>
  </div>

  <div class="mini-calendar">
    <full-calendar [options]="calendarOptions"></full-calendar>
  </div>

  <!-- Or link to main calendar view -->
  <div class="calendar-actions">
    <a mat-button routerLink="/calendar" [queryParams]="{dossierId: dossierId}">
      <mat-icon>open_in_new</mat-icon>
      Ouvrir dans le calendrier principal
    </a>
  </div>
</div>
```

## Example 3: Quick Appointment Creation Button

Add a floating action button to quickly create appointments:

### Component

```typescript
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentFormDialogComponent } from './appointment-form-dialog.component';

@Component({
  selector: 'app-quick-appointment',
  template: `
    <button 
      mat-fab 
      color="accent" 
      class="fab-quick-appointment"
      (click)="openAppointmentDialog()"
      matTooltip="Créer un rendez-vous rapide"
      aria-label="Créer un rendez-vous">
      <mat-icon>event</mat-icon>
    </button>
  `,
  styles: [`
    .fab-quick-appointment {
      position: fixed;
      bottom: 80px;
      right: 24px;
      z-index: 100;
    }
  `]
})
export class QuickAppointmentComponent {
  constructor(private dialog: MatDialog) {}

  openAppointmentDialog(): void {
    this.dialog.open(AppointmentFormDialogComponent, {
      width: '600px',
      data: {
        dossierId: 0, // User must select
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString() // +1 hour
      }
    });
  }
}
```

## Example 4: Widget for Dashboard

Create a mini calendar widget for the dashboard:

### Component

```typescript
import { Component, OnInit } from '@angular/core';
import { AppointmentApiService, AppointmentResponse, AppointmentStatus } from '../services/appointment-api.service';

@Component({
  selector: 'app-calendar-widget',
  templateUrl: './calendar-widget.component.html',
  styleUrls: ['./calendar-widget.component.css']
})
export class CalendarWidgetComponent implements OnInit {
  todayAppointments: AppointmentResponse[] = [];
  upcomingAppointments: AppointmentResponse[] = [];
  loading = false;

  constructor(private appointmentService: AppointmentApiService) {}

  ngOnInit(): void {
    this.loadTodayAppointments();
  }

  loadTodayAppointments(): void {
    this.loading = true;
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    this.appointmentService.list({
      startTimeFrom: todayStart,
      startTimeTo: todayEnd,
      status: AppointmentStatus.SCHEDULED,
      size: 10
    }).subscribe(response => {
      this.todayAppointments = response.content;
      this.loading = false;
    });
  }
}
```

### Component HTML

```html
<mat-card class="calendar-widget">
  <mat-card-header>
    <mat-card-title>
      <mat-icon>calendar_today</mat-icon>
      Rendez-vous du jour
    </mat-card-title>
  </mat-card-header>

  <mat-card-content>
    <div *ngIf="loading" class="loading">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <div *ngIf="!loading && todayAppointments.length === 0" class="empty-state">
      <mat-icon>event_available</mat-icon>
      <p>Aucun rendez-vous aujourd'hui</p>
    </div>

    <mat-list *ngIf="!loading && todayAppointments.length > 0">
      <mat-list-item *ngFor="let apt of todayAppointments">
        <mat-icon matListItemIcon>schedule</mat-icon>
        <div matListItemTitle>{{ apt.startTime | date:'shortTime' }} - {{ apt.assignedTo }}</div>
        <div matListItemLine>{{ apt.location || 'Aucun lieu' }}</div>
      </mat-list-item>
    </mat-list>
  </mat-card-content>

  <mat-card-actions>
    <button mat-button routerLink="/calendar">
      Voir tout le calendrier
      <mat-icon>arrow_forward</mat-icon>
    </button>
  </mat-card-actions>
</mat-card>
```

## Example 5: Appointment List Synchronization

Ensure appointment list and calendar view are synchronized:

### Service Enhancement

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppointmentResponse } from './appointment-api.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentStateService {
  private appointmentsSubject = new BehaviorSubject<AppointmentResponse[]>([]);
  public appointments$ = this.appointmentsSubject.asObservable();

  constructor(private appointmentApi: AppointmentApiService) {}

  loadAppointments(params = {}): void {
    this.appointmentApi.list(params).subscribe(response => {
      this.appointmentsSubject.next(response.content);
    });
  }

  addAppointment(appointment: AppointmentResponse): void {
    const current = this.appointmentsSubject.value;
    this.appointmentsSubject.next([...current, appointment]);
  }

  updateAppointment(updated: AppointmentResponse): void {
    const current = this.appointmentsSubject.value;
    const index = current.findIndex(apt => apt.id === updated.id);
    if (index !== -1) {
      current[index] = updated;
      this.appointmentsSubject.next([...current]);
    }
  }

  deleteAppointment(id: number): void {
    const current = this.appointmentsSubject.value;
    this.appointmentsSubject.next(current.filter(apt => apt.id !== id));
  }
}
```

### Usage in Components

```typescript
// In both CalendarViewComponent and AppointmentListComponent
export class CalendarViewComponent implements OnInit {
  constructor(
    private appointmentState: AppointmentStateService
  ) {}

  ngOnInit(): void {
    this.appointmentState.appointments$.subscribe(appointments => {
      this.appointments = appointments;
      this.updateCalendarEvents();
    });
    
    this.appointmentState.loadAppointments();
  }

  createAppointment(data: any): void {
    this.appointmentService.create(data).subscribe(created => {
      this.appointmentState.addAppointment(created);
      // Calendar automatically updates via subscription
    });
  }
}
```

## Example 6: URL Query Parameters Support

Add support for pre-filtering via URL:

### Calendar Component Enhancement

```typescript
import { ActivatedRoute } from '@angular/router';

export class CalendarViewComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['dossierId']) {
        this.filterByDossierId = parseInt(params['dossierId']);
      }
      if (params['assignedTo']) {
        this.filterByAssignedTo = params['assignedTo'];
      }
      if (params['status']) {
        this.filterByStatus = params['status'] as AppointmentStatus;
      }
      
      this.loadAppointments();
    });
  }

  loadAppointments(): void {
    const params: any = { size: 1000 };
    
    if (this.filterByDossierId) {
      params.dossierId = this.filterByDossierId;
    }
    if (this.filterByAssignedTo) {
      params.assignedTo = this.filterByAssignedTo;
    }
    if (this.filterByStatus) {
      params.status = this.filterByStatus;
    }

    this.appointmentService.list(params).subscribe(/* ... */);
  }
}
```

### Usage

```typescript
// Navigate with filters
this.router.navigate(['/calendar'], {
  queryParams: {
    dossierId: 123,
    assignedTo: 'John Doe',
    status: 'SCHEDULED'
  }
});
```

## Example 7: Export Integration

Add export buttons to various components:

```html
<!-- In any component -->
<button mat-button (click)="exportAppointmentsToICal()">
  <mat-icon>file_download</mat-icon>
  Exporter le calendrier
</button>
```

```typescript
exportAppointmentsToICal(): void {
  // Navigate to calendar view and trigger export
  this.router.navigate(['/calendar']).then(() => {
    // Calendar component will handle the export
    // Or call export service directly
  });
}
```

## Best Practices

1. **State Management**: Use a shared service for appointment state when using calendar in multiple places
2. **Loading States**: Always show loading indicators during API calls
3. **Error Handling**: Provide user-friendly error messages
4. **Accessibility**: Ensure all interactive elements are keyboard accessible
5. **Responsive Design**: Test calendar on mobile devices
6. **Performance**: Use virtual scrolling for large appointment lists
7. **Real-time Updates**: Consider WebSocket integration for multi-user environments
8. **Caching**: Cache appointment data when appropriate
9. **Offline Support**: Store appointments locally for offline access
10. **Testing**: Write comprehensive tests for all calendar interactions

## See Also

- `CALENDAR_VIEW_README.md` - Complete calendar component documentation
- `AppointmentApiService` - API service documentation
- `AppointmentFormDialogComponent` - Form dialog documentation
