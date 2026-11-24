import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DossierStatusCardComponent } from './dossier-status-card.component';
import { DossierResponse, DossierStatus, DossierTransitions } from '../services/dossier-api.service';

const DOSSIER = { id: 7, orgId: 'ORG', status: 'QUALIFIED', statusCode: 'B2B_QUALIFIED', createdAt: '', updatedAt: '' } as unknown as DossierResponse;

const TRANSITIONS: DossierTransitions = {
  caseType: 'CRM_LEAD_B2B_DEMO',
  statusCode: 'B2B_QUALIFIED',
  statusLabel: 'Qualifiée',
  stage: 'OPEN',
  transitions: [
    { statusCode: 'B2B_SCHEDULED', label: 'Démo planifiée', stage: 'OPEN', requires: ['appointment'], reasons: [] },
    {
      statusCode: 'B2B_LOST', label: 'Perdue', stage: 'LOST', requires: ['lossReason'],
      reasons: [{ code: 'B2B_LOST_TIMING', label: 'Pas le bon moment' }, { code: 'B2B_LOST_OTHER', label: 'Autre' }],
    },
  ],
};

describe('DossierStatusCardComponent', () => {
  let httpMock: HttpTestingController;

  function create() {
    const fixture = TestBed.createComponent(DossierStatusCardComponent);
    fixture.componentRef.setInput('dossier', DOSSIER);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/dossiers/7/transitions').flush(TRANSITIONS);
    fixture.detectChanges();
    return fixture;
  }

  const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, ' ');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DossierStatusCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shows the current status and the actions allowed by the server', () => {
    const el: HTMLElement = create().nativeElement;
    expect(text(el)).toContain('Qualifiée');
    expect(text(el)).toContain('Démo planifiée');
    expect(text(el)).toContain('Perdue');
    expect(text(el)).toContain('Nécessite un rendez-vous planifié');
  });

  it('moves to a status that needs nothing more', () => {
    const fixture = create();
    const cmp = fixture.componentInstance;
    let emitted: DossierResponse | undefined;
    cmp.changed.subscribe(d => (emitted = d));

    cmp.choose(TRANSITIONS.transitions[0]);
    const req = httpMock.expectOne('/api/v1/dossiers/7/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ statusCode: 'B2B_SCHEDULED' });
    req.flush({ ...DOSSIER, statusCode: 'B2B_SCHEDULED', status: DossierStatus.APPOINTMENT });
    expect(emitted?.statusCode).toBe('B2B_SCHEDULED');
  });

  it('asks for the loss reason before losing the dossier', () => {
    const fixture = create();
    const cmp = fixture.componentInstance;

    cmp.choose(TRANSITIONS.transitions[1]);
    httpMock.expectNone('/api/v1/dossiers/7/status');
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).toContain('Raison — Perdue');

    cmp.reason = 'B2B_LOST_TIMING';
    cmp.confirm(TRANSITIONS.transitions[1]);
    expect(httpMock.expectOne('/api/v1/dossiers/7/status').request.body)
      .toEqual({ statusCode: 'B2B_LOST', lossReason: 'B2B_LOST_TIMING' });
  });

  it('keeps the actions when the server refuses, and explains why', () => {
    const cmp = create().componentInstance;
    cmp.choose(TRANSITIONS.transitions[0]);
    httpMock.expectOne('/api/v1/dossiers/7/status').flush(
      { properties: { validationErrors: { requiredFieldsActionableMessages: ['Planifiez d\'abord un rendez-vous sur ce dossier.'] } } },
      { status: 400, statusText: 'Bad Request' });
    expect(cmp.busy()).toBe(false);
    expect(cmp.state()?.transitions.length).toBe(2);
  });
});
