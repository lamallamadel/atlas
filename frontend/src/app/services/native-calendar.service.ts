import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Calendar, CalendarEvent } from '@capacitor/calendar';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

export interface CalendarPermissionResult {
  granted: boolean;
  message?: string;
}

/**
 * Service for native calendar integration
 * Supports creating, updating, and deleting calendar events
 */
@Injectable({
  providedIn: 'root'
})
export class NativeCalendarService {
  private readonly isNativePlatform = Capacitor.isNativePlatform();
  private readonly defaultCalendarTitle = 'Atlas Immobilier';

  constructor() { /* no-op */ }

  /**
   * Request calendar permissions
   */
  requestPermissions(): Observable<CalendarPermissionResult> {
    if (!this.isNativePlatform) {
      return of({ granted: false, message: 'Calendar not available on web' });
    }

    return from(Calendar.requestPermissions()).pipe(
      map((result: any) => ({
        granted: result.readWrite,
        message: result.readWrite ? 'Permissions granted' : 'Permissions denied'
      })),
      catchError((error) => {
        console.error('Error requesting calendar permissions:', error);
        return of({ granted: false, message: error.message || 'Permission request failed' });
      })
    );
  }

  /**
   * Check calendar permissions
   */
  checkPermissions(): Observable<CalendarPermissionResult> {
    if (!this.isNativePlatform) {
      return of({ granted: false });
    }

    return from(Calendar.checkPermissions()).pipe(
      map((result: any) => ({ granted: result.readWrite })),
      catchError(() => of({ granted: false }))
    );
  }

  /**
   * Create a calendar event
   */
  createEvent(event: {
    title: string;
    location?: string;
    notes?: string;
    startDate: Date;
    endDate: Date;
    isAllDay?: boolean;
    alertOffsetInMinutes?: number[];
    calendarName?: string;
  }): Observable<CalendarSyncResult> {
    if (!this.isNativePlatform) {
      return of({ success: false, error: 'Calendar not available on web' });
    }

    const calendarEvent: CalendarEvent = {
      title: event.title,
      location: event.location,
      notes: event.notes,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      isAllDay: event.isAllDay || false,
      alertOffsetInMinutes: event.alertOffsetInMinutes || [15], // Default 15min reminder
      calendarName: event.calendarName || this.defaultCalendarTitle
    };

    return from(Calendar.createEvent(calendarEvent)).pipe(
      map((result: any) => ({
        success: true,
        eventId: result.id
      })),
      catchError((error) => {
        console.error('Error creating calendar event:', error);
        return of({
          success: false,
          error: error.message || 'Failed to create calendar event'
        });
      })
    );
  }

  /**
   * Update an existing calendar event
   */
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Observable<CalendarSyncResult> {
    if (!this.isNativePlatform) {
      return of({ success: false, error: 'Calendar not available on web' });
    }

    return from(Calendar.modifyEvent({
      id: eventId,
      ...updates
    })).pipe(
      map(() => ({
        success: true,
        eventId
      })),
      catchError((error) => {
        console.error('Error updating calendar event:', error);
        return of({
          success: false,
          error: error.message || 'Failed to update calendar event'
        });
      })
    );
  }

  /**
   * Delete a calendar event
   */
  deleteEvent(eventId: string): Observable<CalendarSyncResult> {
    if (!this.isNativePlatform) {
      return of({ success: false, error: 'Calendar not available on web' });
    }

    return from(Calendar.deleteEvent({ id: eventId })).pipe(
      map(() => ({
        success: true,
        eventId
      })),
      catchError((error) => {
        console.error('Error deleting calendar event:', error);
        return of({
          success: false,
          error: error.message || 'Failed to delete calendar event'
        });
      })
    );
  }

  /**
   * Get calendar events within a date range
   */
  getEvents(startDate: Date, endDate: Date): Observable<CalendarEvent[]> {
    if (!this.isNativePlatform) {
      return of([]);
    }

    return from(Calendar.listEventsInRange({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })).pipe(
      map((result: any) => result.events || []),
      catchError((error) => {
        console.error('Error fetching calendar events:', error);
        return of([]);
      })
    );
  }

  /**
   * List all available calendars
   */
  listCalendars(): Observable<any[]> {
    if (!this.isNativePlatform) {
      return of([]);
    }

    return from(Calendar.listCalendars()).pipe(
      map((result: any) => result.calendars || []),
      catchError((error) => {
        console.error('Error listing calendars:', error);
        return of([]);
      })
    );
  }

  /**
   * Create a calendar for the app if it doesn't exist
   */
  createAppCalendar(): Observable<CalendarSyncResult> {
    if (!this.isNativePlatform) {
      return of({ success: false, error: 'Calendar not available on web' });
    }

    return from(Calendar.createCalendar({
      title: this.defaultCalendarTitle,
      color: '#2c5aa0',
      isVisible: true
    })).pipe(
      map((result: any) => ({
        success: true,
        eventId: result.id
      })),
      catchError((error) => {
        console.error('Error creating app calendar:', error);
        return of({
          success: false,
          error: error.message || 'Failed to create calendar'
        });
      })
    );
  }

  /**
   * Convert application event to calendar event
   */
  convertToCalendarEvent(
    title: string,
    startDate: Date,
    endDate: Date,
    location?: string,
    notes?: string
  ): CalendarEvent {
    return {
      title,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location,
      notes,
      isAllDay: false,
      alertOffsetInMinutes: [15, 60], // 15min and 1hour before
      calendarName: this.defaultCalendarTitle
    };
  }

  /**
   * Sync a visit/appointment to the calendar
   */
  syncVisitToCalendar(visit: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    address?: string;
    notes?: string;
  }): Observable<CalendarSyncResult> {
    const event = this.convertToCalendarEvent(
      visit.title,
      visit.startDate,
      visit.endDate,
      visit.address,
      visit.notes
    );

    return this.createEvent({
      title: event.title,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      location: event.location,
      notes: event.notes,
      alertOffsetInMinutes: event.alertOffsetInMinutes
    });
  }
}
