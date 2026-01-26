import { Injectable } from '@angular/core';
import { AppointmentResponse } from './appointment-api.service';
import { Observable, from } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface CalendarSyncConfig {
  provider: 'google' | 'outlook' | 'ical';
  autoSync?: boolean;
  syncInterval?: number;
}

export interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  organizer?: string;
  attendees?: string[];
}

export interface CalendarSyncStatus {
  provider: string;
  lastSync?: Date;
  syncEnabled: boolean;
  nextSync?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarSyncService {
  private readonly apiUrl = '/api/v1/calendar-sync';

  constructor(private http: HttpClient) {}

  generateICalendar(appointments: AppointmentResponse[]): string {
    const lines: string[] = [];
    
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Real Estate CRM//Appointments Calendar//FR');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    lines.push('X-WR-CALNAME:Rendez-vous CRM');
    lines.push('X-WR-TIMEZONE:Europe/Paris');
    lines.push('X-WR-CALDESC:Calendrier des rendez-vous du CRM immobilier');

    appointments.forEach(apt => {
      lines.push(...this.generateVEvent(apt));
    });

    lines.push('END:VCALENDAR');
    
    return lines.join('\r\n');
  }

  private generateVEvent(appointment: AppointmentResponse): string[] {
    const lines: string[] = [];
    const startDate = new Date(appointment.startTime);
    const endDate = new Date(appointment.endTime);
    const now = new Date();
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:appointment-${appointment.id}@realestate-crm.com`);
    lines.push(`DTSTAMP:${this.formatICalDateTime(now)}`);
    lines.push(`DTSTART:${this.formatICalDateTime(startDate)}`);
    lines.push(`DTEND:${this.formatICalDateTime(endDate)}`);
    
    const summary = `RDV #${appointment.id}${appointment.assignedTo ? ' - ' + appointment.assignedTo : ''}`;
    lines.push(`SUMMARY:${this.escapeICalText(summary)}`);
    
    if (appointment.location) {
      lines.push(`LOCATION:${this.escapeICalText(appointment.location)}`);
    }
    
    if (appointment.notes) {
      const description = `Dossier: #${appointment.dossierId}\\n${appointment.notes}`;
      lines.push(`DESCRIPTION:${this.escapeICalText(description)}`);
    }
    
    const status = appointment.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED';
    lines.push(`STATUS:${status}`);
    
    if (appointment.assignedTo) {
      lines.push(`ORGANIZER;CN=${this.escapeICalText(appointment.assignedTo)}:mailto:${appointment.assignedTo.toLowerCase().replace(/\s+/g, '.')}@company.com`);
    }
    
    lines.push(`CREATED:${this.formatICalDateTime(new Date(appointment.createdAt))}`);
    lines.push(`LAST-MODIFIED:${this.formatICalDateTime(new Date(appointment.updatedAt))}`);
    lines.push(`SEQUENCE:0`);
    lines.push(`TRANSP:OPAQUE`);
    
    lines.push('END:VEVENT');
    
    return lines;
  }

  private formatICalDateTime(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  downloadICalendar(appointments: AppointmentResponse[], filename?: string): void {
    const icsContent = this.generateICalendar(appointments);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `appointments_${new Date().toISOString().split('T')[0]}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async importFromICalendar(file: File): Promise<ICalEvent[]> {
    const text = await file.text();
    return this.parseICalendar(text);
  }

  private parseICalendar(icalText: string): ICalEvent[] {
    const events: ICalEvent[] = [];
    const lines = icalText.split(/\r?\n/);
    let currentEvent: Partial<ICalEvent> | null = null;

    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT') && currentEvent) {
        if (currentEvent.uid && currentEvent.summary && currentEvent.start && currentEvent.end) {
          events.push(currentEvent as ICalEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).split(';')[0];
          const value = line.substring(colonIndex + 1);

          switch (key) {
            case 'UID':
              currentEvent.uid = value;
              break;
            case 'SUMMARY':
              currentEvent.summary = this.unescapeICalText(value);
              break;
            case 'DESCRIPTION':
              currentEvent.description = this.unescapeICalText(value);
              break;
            case 'LOCATION':
              currentEvent.location = this.unescapeICalText(value);
              break;
            case 'DTSTART':
              currentEvent.start = this.parseICalDateTime(value);
              break;
            case 'DTEND':
              currentEvent.end = this.parseICalDateTime(value);
              break;
            case 'STATUS':
              currentEvent.status = value as 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
              break;
          }
        }
      }
    }

    return events;
  }

  private parseICalDateTime(value: string): Date {
    const year = parseInt(value.substring(0, 4), 10);
    const month = parseInt(value.substring(4, 6), 10) - 1;
    const day = parseInt(value.substring(6, 8), 10);
    const hours = parseInt(value.substring(9, 11), 10);
    const minutes = parseInt(value.substring(11, 13), 10);
    const seconds = parseInt(value.substring(13, 15), 10);
    
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  }

  private unescapeICalText(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  getGoogleCalendarAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>(`${this.apiUrl}/google/auth-url`);
  }

  getOutlookAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>(`${this.apiUrl}/outlook/auth-url`);
  }

  handleOAuthCallback(provider: 'google' | 'outlook', code: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${provider}/callback`, { code });
  }

  getSyncStatus(): Observable<CalendarSyncStatus[]> {
    return this.http.get<CalendarSyncStatus[]>(`${this.apiUrl}/status`);
  }

  enableSync(provider: 'google' | 'outlook', config: CalendarSyncConfig): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${provider}/enable`, config);
  }

  disableSync(provider: 'google' | 'outlook'): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${provider}/disable`, {});
  }

  triggerManualSync(provider: 'google' | 'outlook'): Observable<{ success: boolean; syncedCount: number }> {
    return this.http.post<{ success: boolean; syncedCount: number }>(`${this.apiUrl}/${provider}/sync`, {});
  }

  getICalendarFeedUrl(): Observable<{ feedUrl: string; token: string }> {
    return this.http.get<{ feedUrl: string; token: string }>(`${this.apiUrl}/ical/feed-url`);
  }

  regenerateICalendarToken(): Observable<{ feedUrl: string; token: string }> {
    return this.http.post<{ feedUrl: string; token: string }>(`${this.apiUrl}/ical/regenerate-token`, {});
  }
}
