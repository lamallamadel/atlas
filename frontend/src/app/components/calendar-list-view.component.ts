import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AppointmentApiService, AppointmentResponse, AppointmentStatus } from '../services/appointment-api.service';
import { Subject, takeUntil } from 'rxjs';
import { ToastNotificationService } from '../services/toast-notification.service';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentFormDialogComponent, AppointmentFormData } from './appointment-form-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

interface AppointmentGroup {
  date: Date;
  dateLabel: string;
  appointments: AppointmentResponse[];
}

@Component({
  selector: 'app-calendar-list-view',
  templateUrl: './calendar-list-view.component.html',
  styleUrls: ['./calendar-list-view.component.css']
})
export class CalendarListViewComponent implements OnInit, OnDestroy {
  @Input() filterByAssignedTo: string | null = null;
  @Input() filterByStatus: AppointmentStatus | null = null;
  @Input() startDate?: Date;
  @Input() endDate?: Date;
  
  @Output() appointmentClick = new EventEmitter<AppointmentResponse>();
  @Output() appointmentUpdated = new EventEmitter<AppointmentResponse>();
  @Output() appointmentDeleted = new EventEmitter<number>();

  private destroy$ = new Subject<void>();
  
  appointments: AppointmentResponse[] = [];
  groupedAppointments: AppointmentGroup[] = [];
  isLoading = false;
  isMobile = false;
  expandedGroups = new Set<string>();

  readonly statusColors = {
    [AppointmentStatus.SCHEDULED]: '#2196F3',
    [AppointmentStatus.COMPLETED]: '#4CAF50',
    [AppointmentStatus.CANCELLED]: '#9E9E9E'
  };

  readonly statusLabels = {
    [AppointmentStatus.SCHEDULED]: 'Planifié',
    [AppointmentStatus.COMPLETED]: 'Terminé',
    [AppointmentStatus.CANCELLED]: 'Annulé'
  };

  constructor(
    private appointmentService: AppointmentApiService,
    private toastService: ToastNotificationService,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });

    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAppointments(): void {
    this.isLoading = true;
    const params: any = { 
      size: 1000,
      sort: 'startTime,asc'
    };
    
    if (this.filterByStatus) {
      params.status = this.filterByStatus;
    }

    if (this.filterByAssignedTo) {
      params.assignedTo = this.filterByAssignedTo;
    }

    if (this.startDate) {
      params.startTimeFrom = this.startDate.toISOString();
    }

    if (this.endDate) {
      params.startTimeTo = this.endDate.toISOString();
    }

    this.appointmentService.list(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.appointments = response.content;
          this.groupAppointmentsByDate();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
          this.toastService.error('Erreur lors du chargement des rendez-vous');
          this.isLoading = false;
        }
      });
  }

  private groupAppointmentsByDate(): void {
    const groups = new Map<string, AppointmentResponse[]>();

    this.appointments.forEach(apt => {
      const date = new Date(apt.startTime);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString();

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(apt);
    });

    this.groupedAppointments = Array.from(groups.entries())
      .map(([dateKey, appointments]) => {
        const date = new Date(dateKey);
        return {
          date,
          dateLabel: this.formatDateLabel(date),
          appointments: appointments.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    this.groupedAppointments.forEach(group => {
      this.expandedGroups.add(group.dateLabel);
    });
  }

  private formatDateLabel(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Aujourd'hui";
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return 'Demain';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    
    if (durationMinutes < 60) {
      return `${durationMinutes} min`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  }

  getStatusColor(status: AppointmentStatus): string {
    return this.statusColors[status] || '#757575';
  }

  getStatusLabel(status: AppointmentStatus): string {
    return this.statusLabels[status] || status;
  }

  toggleGroup(dateLabel: string): void {
    if (this.expandedGroups.has(dateLabel)) {
      this.expandedGroups.delete(dateLabel);
    } else {
      this.expandedGroups.add(dateLabel);
    }
  }

  isGroupExpanded(dateLabel: string): boolean {
    return this.expandedGroups.has(dateLabel);
  }

  onAppointmentClick(appointment: AppointmentResponse): void {
    this.appointmentClick.emit(appointment);
    
    if (this.isMobile) {
      this.openAppointmentDetails(appointment);
    }
  }

  openAppointmentDetails(appointment: AppointmentResponse): void {
    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      width: this.isMobile ? '95vw' : '600px',
      maxWidth: this.isMobile ? '95vw' : '600px',
      data: {
        id: appointment.id,
        dossierId: appointment.dossierId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        location: appointment.location,
        assignedTo: appointment.assignedTo,
        notes: appointment.notes,
        status: appointment.status
      } as AppointmentFormData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.appointmentUpdated.emit(result);
          this.loadAppointments();
        }
      });
  }

  getAppointmentTitle(appointment: AppointmentResponse): string {
    let title = `RDV #${appointment.id}`;
    if (appointment.assignedTo) {
      title += ` - ${appointment.assignedTo}`;
    }
    return title;
  }

  refresh(): void {
    this.loadAppointments();
  }

  get totalAppointments(): number {
    return this.appointments.length;
  }

  get upcomingAppointments(): number {
    const now = new Date();
    return this.appointments.filter(apt => 
      new Date(apt.startTime) > now && 
      apt.status === AppointmentStatus.SCHEDULED
    ).length;
  }

  trackByGroup(index: number, group: AppointmentGroup): string {
    return group.dateLabel;
  }

  trackByAppointment(index: number, appointment: AppointmentResponse): number {
    return appointment.id;
  }
}
