import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AnnonceReportsPanelComponent } from './annonce-reports-panel.component';
import { AnnonceReport } from '../services/annonce-report-api.service';

const OPEN: AnnonceReport = {
  id: 11, annonceId: 7, reasonCode: 'REPORT_FRAUD', comment: 'Prix trop bas',
  reporterEmail: 'v@example.ma', status: 'OPEN', createdAt: '2026-11-23T10:00:00',
};
const CLOSED: AnnonceReport = {
  id: 12, annonceId: 7, reasonCode: 'REPORT_OTHER', status: 'CLOSED', resolution: 'DISMISSED',
  closedBy: 'agent', closedAt: '2026-11-23T11:00:00', createdAt: '2026-11-22T10:00:00',
};

describe('AnnonceReportsPanelComponent', () => {
  let httpMock: HttpTestingController;

  function create() {
    const fixture = TestBed.createComponent(AnnonceReportsPanelComponent);
    fixture.componentRef.setInput('annonceId', 7);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AnnonceReportsPanelComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('renders nothing when the annonce has no report', () => {
    const fixture = create();
    httpMock.expectOne('/api/v1/annonces/7/reports').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('lists reports with their reason and what is left to handle', () => {
    const fixture = create();
    httpMock.expectOne('/api/v1/annonces/7/reports').flush([OPEN, CLOSED]);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Arnaque ou annonce suspecte');
    expect(text).toContain('« Prix trop bas »');
    expect(text).toContain('1 à traiter');
    expect(text).toContain('Écarté par agent');
  });

  it('suspends the annonce from a report and tells the page to reload', () => {
    const fixture = create();
    httpMock.expectOne('/api/v1/annonces/7/reports').flush([OPEN]);
    fixture.detectChanges();

    let suspended = false;
    fixture.componentInstance.annonceSuspended.subscribe(() => (suspended = true));
    fixture.componentInstance.close(OPEN, 'ANNONCE_SUSPENDED');

    const req = httpMock.expectOne('/api/v1/annonce-reports/11/close');
    expect(req.request.body).toEqual({ resolution: 'ANNONCE_SUSPENDED', comment: null });
    req.flush({ ...OPEN, status: 'CLOSED', resolution: 'ANNONCE_SUSPENDED' });
    httpMock.expectOne('/api/v1/annonces/7/reports').flush([]);

    expect(suspended).toBe(true);
  });

  it('dismisses without reloading the annonce', () => {
    const fixture = create();
    httpMock.expectOne('/api/v1/annonces/7/reports').flush([OPEN]);

    let suspended = false;
    fixture.componentInstance.annonceSuspended.subscribe(() => (suspended = true));
    fixture.componentInstance.close(OPEN, 'DISMISSED');
    httpMock.expectOne('/api/v1/annonce-reports/11/close').flush({ ...OPEN, status: 'CLOSED' });
    httpMock.expectOne('/api/v1/annonces/7/reports').flush([]);

    expect(suspended).toBe(false);
  });
});
