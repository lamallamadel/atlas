import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DossierAssigneeCardComponent, UNASSIGNED } from './dossier-assignee-card.component';
import { AuthService } from '../services/auth.service';
import { DossierResponse, DossierStatus } from '../services/dossier-api.service';

function dossier(overrides: Partial<DossierResponse> = {}): DossierResponse {
  return {
    id: 5, orgId: 'ORG-001', leadName: 'Yasmine', status: DossierStatus.NEW,
    createdAt: '2026-11-23T10:00:00', updatedAt: '2026-11-23T10:00:00', ...overrides,
  } as DossierResponse;
}

describe('DossierAssigneeCardComponent', () => {
  let httpMock: HttpTestingController;
  let roles: string[];

  function create(d: DossierResponse) {
    const fixture = TestBed.createComponent(DossierAssigneeCardComponent);
    fixture.componentRef.setInput('dossier', d);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    roles = ['PRO'];
    TestBed.configureTestingModule({
      imports: [DossierAssigneeCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { hasRole: (r: string) => roles.includes(r) } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lets an agent take an unassigned dossier', () => {
    const fixture = create(dossier());
    expect(fixture.nativeElement.textContent).toContain('À attribuer');
    expect(fixture.nativeElement.textContent).toContain('Je prends ce dossier');
    expect(fixture.nativeElement.textContent).not.toContain('Réassigner');
    httpMock.expectNone('/api/v1/team');

    let emitted: DossierResponse | undefined;
    fixture.componentInstance.changed.subscribe(d => (emitted = d));
    fixture.componentInstance.claim();
    const req = httpMock.expectOne('/api/v1/dossiers/5/claim');
    expect(req.request.method).toBe('POST');
    req.flush(dossier({ assignedTo: 'agent-1', assignedToName: 'Amine' }));
    expect(emitted?.assignedTo).toBe('agent-1');
  });

  it('shows the agent of an assigned dossier without the take button', () => {
    const fixture = create(dossier({ assignedTo: 'agent-1', assignedToName: 'Amine' }));
    expect(fixture.nativeElement.textContent).toContain('Amine');
    expect(fixture.nativeElement.textContent).not.toContain('Je prends');
  });

  it('lets a manager reassign or put the dossier back to unassigned', () => {
    roles = ['MANAGER'];
    const fixture = create(dossier({ assignedTo: 'agent-1', assignedToName: 'Amine' }));
    httpMock.expectOne('/api/v1/team').flush([
      { userId: 'agent-1', name: 'Amine' },
      { userId: 'agent-2', name: 'Salma' },
    ]);
    const cmp = fixture.componentInstance;
    expect(cmp.options().map(o => o.value)).toEqual([UNASSIGNED, 'agent-1', 'agent-2']);

    cmp.reassign('agent-2');
    const req = httpMock.expectOne('/api/v1/dossiers/5/assign');
    expect(req.request.body).toEqual({ userId: 'agent-2' });
    req.flush(dossier({ assignedTo: 'agent-2', assignedToName: 'Salma' }));

    cmp.reassign(UNASSIGNED);
    expect(httpMock.expectOne('/api/v1/dossiers/5/assign').request.body).toEqual({ userId: null });
  });

  it('keeps the current agent selectable even if the directory does not list him', () => {
    roles = ['ADMIN'];
    const fixture = create(dossier({ assignedTo: 'old-agent', assignedToName: 'Ancien agent' }));
    httpMock.expectOne('/api/v1/team').flush([{ userId: 'agent-2', name: 'Salma' }]);
    expect(fixture.componentInstance.options().map(o => o.label)).toContain('Ancien agent');
  });
});
