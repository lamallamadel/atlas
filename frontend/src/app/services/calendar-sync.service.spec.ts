import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CalendarSyncService } from './calendar-sync.service';
import { AppointmentResponse, AppointmentStatus } from './appointment-api.service';

describe('CalendarSyncService', () => {
  let service: CalendarSyncService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CalendarSyncService]
    });
    service = TestBed.inject(CalendarSyncService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate valid iCalendar content', () => {
    const appointments: AppointmentResponse[] = [{
      id: 1,
      orgId: 'org1',
      dossierId: 100,
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
      location: 'Test Location',
      assignedTo: 'John Doe',
      notes: 'Test notes',
      status: AppointmentStatus.SCHEDULED,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }];

    const icsContent = service.generateICalendar(appointments);

    expect(icsContent).toContain('BEGIN:VCALENDAR');
    expect(icsContent).toContain('VERSION:2.0');
    expect(icsContent).toContain('BEGIN:VEVENT');
    expect(icsContent).toContain('UID:appointment-1@realestate-crm.com');
    expect(icsContent).toContain('SUMMARY:RDV #1 - John Doe');
    expect(icsContent).toContain('LOCATION:Test Location');
    expect(icsContent).toContain('STATUS:CONFIRMED');
    expect(icsContent).toContain('END:VEVENT');
    expect(icsContent).toContain('END:VCALENDAR');
  });

  it('should get Google Calendar auth URL', () => {
    const mockResponse = { authUrl: 'https://accounts.google.com/oauth' };

    service.getGoogleCalendarAuthUrl().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/calendar-sync/google/auth-url');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get sync status', () => {
    const mockStatus = [
      { provider: 'google', syncEnabled: true, lastSync: new Date() }
    ];

    service.getSyncStatus().subscribe(status => {
      expect(status).toEqual(mockStatus);
    });

    const req = httpMock.expectOne('/api/v1/calendar-sync/status');
    expect(req.request.method).toBe('GET');
    req.flush(mockStatus);
  });
});
