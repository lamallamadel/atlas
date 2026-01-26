import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { AppointmentApiService, AppointmentResponse, AppointmentStatus, AppointmentCreateRequest, AppointmentUpdateRequest } from '../services/appointment-api.service';
import { CalendarSyncService } from '../services/calendar-sync.service';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentFormDialogComponent, AppointmentFormData } from './appointment-form-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { ToastNotificationService } from '../services/toast-notification.service';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    appointmentId: number;
    dossierId: number;
    location?: string;
    assignedTo?: string;
    notes?: string;
    status: AppointmentStatus;
  };
}

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css']
})
export class CalendarViewComponent implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarComponent: any;

  private destroy$ = new Subject<void>();
  isMobile = false;
  currentView = 'timeGridWeek';
  showListView = false;
  calendarLoaded = false;
  calendarLoading = false;
  
  calendarOptions: any = {
    plugins: [],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    locale: 'fr',
    firstDay: 1,
    slotMinTime: '07:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:30:00',
    snapDuration: '00:15:00',
    allDaySlot: false,
    height: 'auto',
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    nowIndicator: true,
    selectOverlap: false,
    eventOverlap: false,
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00'
    },
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventResize: this.handleEventResize.bind(this),
    select: this.handleDateSelect.bind(this),
    events: [],
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false
    },
    eventClassNames: (arg: any) => {
      const classes = ['fc-event-custom'];
      if (arg.event.extendedProps && arg.event.extendedProps['status'] === AppointmentStatus.CANCELLED) {
        classes.push('fc-event-cancelled');
      } else if (arg.event.extendedProps && arg.event.extendedProps['status'] === AppointmentStatus.COMPLETED) {
        classes.push('fc-event-completed');
      }
      return classes;
    }
  };

  appointments: AppointmentResponse[] = [];
  isLoading = false;
  filterByAssignedTo: string | null = null;
  filterByStatus: AppointmentStatus | null = null;
  availableAssignees: string[] = [];

  readonly statusOptions = [
    { value: null, label: 'Tous les statuts' },
    { value: AppointmentStatus.SCHEDULED, label: 'Planifié' },
    { value: AppointmentStatus.COMPLETED, label: 'Terminé' },
    { value: AppointmentStatus.CANCELLED, label: 'Annulé' }
  ];

  constructor(
    private appointmentService: AppointmentApiService,
    private calendarSyncService: CalendarSyncService,
    private dialog: MatDialog,
    private toastService: ToastNotificationService,
    private breakpointObserver: BreakpointObserver
  ) {}

  async ngOnInit(): Promise<void> {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        if (this.isMobile && this.currentView !== 'listWeek') {
          this.changeView('listWeek');
        }
      });

    await this.loadCalendarPlugins();
    this.loadAppointments();
  }

  private async loadCalendarPlugins(): Promise<void> {
    if (this.calendarLoaded) {
      return;
    }

    if (this.calendarLoading) {
      return;
    }

    this.calendarLoading = true;

    try {
      const [
        { default: dayGridPlugin },
        { default: timeGridPlugin },
        { default: listPlugin },
        { default: interactionPlugin },
        { default: iCalendarPlugin }
      ] = await Promise.all([
        import('@fullcalendar/daygrid'),
        import('@fullcalendar/timegrid'),
        import('@fullcalendar/list'),
        import('@fullcalendar/interaction'),
        import('@fullcalendar/icalendar')
      ]);

      this.calendarOptions.plugins = [
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin,
        iCalendarPlugin
      ];

      this.calendarLoaded = true;
      this.calendarLoading = false;
    } catch (error) {
      console.error('Failed to load FullCalendar plugins:', error);
      this.calendarLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAppointments(): void {
    this.isLoading = true;
    const params: any = { size: 1000 };
    
    if (this.filterByStatus) {
      params.status = this.filterByStatus;
    }

    this.appointmentService.list(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.appointments = response.content;
          this.extractAvailableAssignees();
          this.updateCalendarEvents();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
          this.toastService.error('Erreur lors du chargement des rendez-vous');
          this.isLoading = false;
        }
      });
  }

  private extractAvailableAssignees(): void {
    const assignees = new Set<string>();
    this.appointments.forEach(apt => {
      if (apt.assignedTo) {
        assignees.add(apt.assignedTo);
      }
    });
    this.availableAssignees = Array.from(assignees).sort();
  }

  private updateCalendarEvents(): void {
    let filteredAppointments = this.appointments;

    if (this.filterByAssignedTo) {
      filteredAppointments = filteredAppointments.filter(
        apt => apt.assignedTo === this.filterByAssignedTo
      );
    }

    const events: CalendarEvent[] = filteredAppointments.map(apt => ({
      id: apt.id.toString(),
      title: this.getEventTitle(apt),
      start: apt.startTime,
      end: apt.endTime,
      backgroundColor: this.getStatusColor(apt.status),
      borderColor: this.getStatusColor(apt.status),
      extendedProps: {
        appointmentId: apt.id,
        dossierId: apt.dossierId,
        location: apt.location,
        assignedTo: apt.assignedTo,
        notes: apt.notes,
        status: apt.status
      }
    }));

    this.calendarOptions.events = events;
  }

  private getEventTitle(appointment: AppointmentResponse): string {
    let title = `RDV #${appointment.id}`;
    if (appointment.assignedTo) {
      title += ` - ${appointment.assignedTo}`;
    }
    if (appointment.location) {
      title += ` (${appointment.location})`;
    }
    return title;
  }

  private getStatusColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return '#2196F3';
      case AppointmentStatus.COMPLETED:
        return '#4CAF50';
      case AppointmentStatus.CANCELLED:
        return '#9E9E9E';
      default:
        return '#757575';
    }
  }

  handleDateSelect(selectInfo: any): void {
    const calendarApi = selectInfo.view.calendar;

    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      width: '600px',
      data: {
        dossierId: 0,
        startTime: selectInfo.startStr,
        endTime: selectInfo.endStr,
        status: AppointmentStatus.SCHEDULED
      } as AppointmentFormData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          if (result.dossierId === 0) {
            this.toastService.warning('Veuillez sélectionner un dossier pour créer le rendez-vous');
            calendarApi.unselect();
            return;
          }

          this.createAppointment(result);
        }
        calendarApi.unselect();
      });
  }

  handleEventClick(clickInfo: any): void {
    const appointmentId = parseInt(clickInfo.event.id);
    const appointment = this.appointments.find(apt => apt.id === appointmentId);

    if (!appointment) {
      return;
    }

    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      width: '600px',
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
          this.updateAppointment(result);
        }
      });
  }

  handleEventDrop(dropInfo: any): void {
    const appointmentId = parseInt(dropInfo.event.id);
    const appointment = this.appointments.find(apt => apt.id === appointmentId);

    if (!appointment) {
      dropInfo.revert();
      return;
    }

    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;

    if (!newStart || !newEnd) {
      dropInfo.revert();
      return;
    }

    const conflicts = this.detectConflicts(appointmentId, newStart, newEnd, appointment.assignedTo);
    
    if (conflicts.length > 0) {
      const conflictMessages = conflicts.map(c => 
        `RDV #${c.id} (${this.formatTime(c.startTime)} - ${this.formatTime(c.endTime)})`
      ).join(', ');
      
      this.toastService.warning(`Conflit détecté avec: ${conflictMessages}`);
      dropInfo.revert();
      return;
    }

    const oldStartTime = appointment.startTime;
    const oldEndTime = appointment.endTime;
    
    const optimisticUpdate = {
      ...appointment,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString()
    };
    
    const index = this.appointments.findIndex(apt => apt.id === appointmentId);
    if (index !== -1) {
      this.appointments[index] = optimisticUpdate;
    }

    const updateRequest: AppointmentUpdateRequest = {
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      location: appointment.location,
      assignedTo: appointment.assignedTo,
      notes: appointment.notes,
      status: appointment.status
    };

    this.appointmentService.update(appointmentId, updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          const idx = this.appointments.findIndex(apt => apt.id === appointmentId);
          if (idx !== -1) {
            this.appointments[idx] = updated;
          }
          this.updateCalendarEvents();
          this.toastService.success('Rendez-vous déplacé avec succès');
        },
        error: (error) => {
          console.error('Error updating appointment:', error);
          
          if (index !== -1) {
            this.appointments[index] = {
              ...appointment,
              startTime: oldStartTime,
              endTime: oldEndTime
            };
          }
          
          this.updateCalendarEvents();
          this.toastService.error('Erreur lors du déplacement du rendez-vous');
          dropInfo.revert();
        }
      });
  }

  handleEventResize(resizeInfo: any): void {
    const appointmentId = parseInt(resizeInfo.event.id);
    const appointment = this.appointments.find(apt => apt.id === appointmentId);

    if (!appointment) {
      resizeInfo.revert();
      return;
    }

    const newStart = resizeInfo.event.start;
    const newEnd = resizeInfo.event.end;

    if (!newStart || !newEnd) {
      resizeInfo.revert();
      return;
    }

    const conflicts = this.detectConflicts(appointmentId, newStart, newEnd, appointment.assignedTo);
    
    if (conflicts.length > 0) {
      this.toastService.warning('Conflit détecté : redimensionnement impossible');
      resizeInfo.revert();
      return;
    }

    const oldStartTime = appointment.startTime;
    const oldEndTime = appointment.endTime;
    
    const optimisticUpdate = {
      ...appointment,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString()
    };
    
    const index = this.appointments.findIndex(apt => apt.id === appointmentId);
    if (index !== -1) {
      this.appointments[index] = optimisticUpdate;
    }

    const updateRequest: AppointmentUpdateRequest = {
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      location: appointment.location,
      assignedTo: appointment.assignedTo,
      notes: appointment.notes,
      status: appointment.status
    };

    this.appointmentService.update(appointmentId, updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          const idx = this.appointments.findIndex(apt => apt.id === appointmentId);
          if (idx !== -1) {
            this.appointments[idx] = updated;
          }
          this.updateCalendarEvents();
          this.toastService.success('Rendez-vous modifié avec succès');
        },
        error: (error) => {
          console.error('Error resizing appointment:', error);
          
          if (index !== -1) {
            this.appointments[index] = {
              ...appointment,
              startTime: oldStartTime,
              endTime: oldEndTime
            };
          }
          
          this.updateCalendarEvents();
          this.toastService.error('Erreur lors de la modification du rendez-vous');
          resizeInfo.revert();
        }
      });
  }

  private checkConflict(appointmentId: number, start: Date, end: Date, assignedTo?: string): boolean {
    return this.detectConflicts(appointmentId, start, end, assignedTo).length > 0;
  }

  private detectConflicts(appointmentId: number, start: Date, end: Date, assignedTo?: string): AppointmentResponse[] {
    if (!assignedTo) {
      return [];
    }

    return this.appointments.filter(apt => {
      if (apt.id === appointmentId) {
        return false;
      }

      if (apt.assignedTo !== assignedTo) {
        return false;
      }

      if (apt.status === AppointmentStatus.CANCELLED) {
        return false;
      }

      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);

      return (start < aptEnd && end > aptStart);
    });
  }

  private formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  createAppointment(data: AppointmentFormData): void {
    const request: AppointmentCreateRequest = {
      dossierId: data.dossierId,
      startTime: data.startTime!,
      endTime: data.endTime!,
      location: data.location,
      assignedTo: data.assignedTo,
      notes: data.notes,
      status: data.status || AppointmentStatus.SCHEDULED
    };

    this.appointmentService.create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          this.appointments.push(created);
          this.extractAvailableAssignees();
          this.updateCalendarEvents();
          this.toastService.success('Rendez-vous créé avec succès');
        },
        error: (error) => {
          console.error('Error creating appointment:', error);
          this.toastService.error('Erreur lors de la création du rendez-vous');
        }
      });
  }

  updateAppointment(data: AppointmentFormData): void {
    if (!data.id) {
      return;
    }

    const request: AppointmentUpdateRequest = {
      startTime: data.startTime!,
      endTime: data.endTime!,
      location: data.location,
      assignedTo: data.assignedTo,
      notes: data.notes,
      status: data.status || AppointmentStatus.SCHEDULED
    };

    this.appointmentService.update(data.id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          const index = this.appointments.findIndex(apt => apt.id === data.id);
          if (index !== -1) {
            this.appointments[index] = updated;
          }
          this.extractAvailableAssignees();
          this.updateCalendarEvents();
          this.toastService.success('Rendez-vous mis à jour avec succès');
        },
        error: (error) => {
          console.error('Error updating appointment:', error);
          this.toastService.error('Erreur lors de la mise à jour du rendez-vous');
        }
      });
  }

  deleteAppointment(appointmentId: number): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le rendez-vous',
        message: 'Êtes-vous sûr de vouloir supprimer ce rendez-vous ?'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.appointmentService.delete(appointmentId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.appointments = this.appointments.filter(apt => apt.id !== appointmentId);
                this.extractAvailableAssignees();
                this.updateCalendarEvents();
                this.toastService.success('Rendez-vous supprimé avec succès');
              },
              error: (error) => {
                console.error('Error deleting appointment:', error);
                this.toastService.error('Erreur lors de la suppression du rendez-vous');
              }
            });
        }
      });
  }

  onFilterByAssignedToChange(assignedTo: string | null): void {
    this.filterByAssignedTo = assignedTo;
    this.updateCalendarEvents();
  }

  onFilterByStatusChange(status: AppointmentStatus | null): void {
    this.filterByStatus = status;
    this.loadAppointments();
  }

  exportToICal(): void {
    let filteredAppointments = this.appointments;

    if (this.filterByAssignedTo) {
      filteredAppointments = filteredAppointments.filter(
        apt => apt.assignedTo === this.filterByAssignedTo
      );
    }

    if (this.filterByStatus) {
      filteredAppointments = filteredAppointments.filter(
        apt => apt.status === this.filterByStatus
      );
    }

    this.calendarSyncService.downloadICalendar(
      filteredAppointments,
      `appointments_${new Date().toISOString().split('T')[0]}.ics`
    );
    
    this.toastService.success('Calendrier exporté avec succès');
  }

  refreshCalendar(): void {
    this.loadAppointments();
  }

  changeView(viewType: string): void {
    this.currentView = viewType;
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.changeView(viewType);
    }
  }

  toggleListView(): void {
    this.showListView = !this.showListView;
  }

  goToToday(): void {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
  }

  goToPrev(): void {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.prev();
    }
  }

  goToNext(): void {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.next();
    }
  }
}
