import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NgForm } from '@angular/forms';
import { TeamComponent } from './team.component';
import { AuthService } from '../../services/auth.service';
import { TeamMember } from '../../services/team-api.service';

const ALL = (r: HttpRequest<unknown>) => r.url === '/api/v1/team' && r.params.get('includeDisabled') === 'true';

const SETTINGS = '/api/v1/team/settings';

const MEMBERS: TeamMember[] = [
  { userId: 'admin-1', name: 'Adel', email: 'adel@agence.ma', role: 'ADMIN', enabled: true },
  { userId: 'agent-1', name: 'Amine', email: 'amine@agence.ma', role: 'AGENT', enabled: true },
  { userId: 'agent-2', name: 'Salma', email: 'salma@agence.ma', role: 'AGENT', enabled: false },
];

describe('TeamComponent', () => {
  let httpMock: HttpTestingController;
  let roles: string[];

  function create() {
    const fixture = TestBed.createComponent(TeamComponent);
    fixture.detectChanges();
    httpMock.expectOne(ALL).flush(MEMBERS);
    httpMock.expectOne(SETTINGS).flush({ restrictAgentsToOwnDossiers: false });
    fixture.detectChanges();
    return fixture;
  }

  const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, ' ');

  beforeEach(() => {
    roles = ['ADMIN'];
    TestBed.configureTestingModule({
      imports: [TeamComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { hasRole: (r: string) => roles.includes(r), getUserId: () => 'admin-1' } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shows members with their role and status', () => {
    const el: HTMLElement = create().nativeElement;
    expect(text(el)).toContain('Adel (vous)');
    expect(text(el)).toContain('salma@agence.ma');
    expect(text(el)).toContain('Désactivé');
    // L'admin peut gérer les autres, pas lui-même.
    expect(el.querySelectorAll('tbody ds-select').length).toBe(2);
    expect(text(el)).toContain('Réactiver');
  });

  it('lets the admin change a role and rolls back on error', () => {
    const cmp = create().componentInstance;

    cmp.changeRole(cmp.members()[1], 'MANAGER');
    const ok = httpMock.expectOne('/api/v1/team/agent-1/role');
    expect(ok.request.method).toBe('PUT');
    expect(ok.request.body).toEqual({ role: 'MANAGER' });
    ok.flush({ ...MEMBERS[1], role: 'MANAGER' });
    expect(cmp.members()[1].role).toBe('MANAGER');

    cmp.changeRole(cmp.members()[1], 'ADMIN');
    httpMock.expectOne('/api/v1/team/agent-1/role').flush(
      { detail: 'LAST_ADMIN' }, { status: 409, statusText: 'Conflict' });
    expect(cmp.members()[1].role).toBe('MANAGER');
  });

  it('disables and re-enables a member', () => {
    const cmp = create().componentInstance;

    cmp.toggleEnabled(cmp.members()[1]);
    const req = httpMock.expectOne('/api/v1/team/agent-1/enabled');
    expect(req.request.body).toEqual({ enabled: false });
    req.flush({ ...MEMBERS[1], enabled: false });
    expect(cmp.members()[1].enabled).toBe(false);

    cmp.toggleEnabled(cmp.members()[2]);
    expect(httpMock.expectOne('/api/v1/team/agent-2/enabled').request.body).toEqual({ enabled: true });
  });

  it('lets a manager invite agents only, without managing roles', () => {
    roles = ['MANAGER'];
    const fixture = create();
    const cmp = fixture.componentInstance;
    const el: HTMLElement = fixture.nativeElement;

    expect(cmp.inviteRoleOptions.map(o => o.value)).toEqual(['AGENT']);
    expect(el.querySelectorAll('tbody ds-select').length).toBe(0);
    expect(text(el)).not.toContain('Désactiver');

    cmp.draft = { firstName: 'Nadia', lastName: 'B', email: ' nadia@agence.ma ', role: 'AGENT' };
    cmp.invite({ invalid: false, resetForm: () => undefined } as unknown as NgForm);
    const req = httpMock.expectOne('/api/v1/users/invite');
    expect(req.request.body).toEqual({ firstName: 'Nadia', lastName: 'B', email: 'nadia@agence.ma', role: 'AGENT' });
    req.flush({ id: 'new', email: 'nadia@agence.ma', status: 'INVITED', role: 'AGENT' });
    httpMock.expectOne(ALL).flush(MEMBERS);
    expect(cmp.draft.email).toBe('');
  });

  it('warns when roles are unknown (directory unavailable)', () => {
    const fixture = TestBed.createComponent(TeamComponent);
    fixture.detectChanges();
    httpMock.expectOne(ALL).flush([{ userId: 'agent-1', name: 'agent-1' }]);
    httpMock.expectOne(SETTINGS).flush({ restrictAgentsToOwnDossiers: false });
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).toContain('Rôles indisponibles');
    expect(fixture.nativeElement.querySelectorAll('tbody ds-select').length).toBe(0);
  });

  it('lets the admin restrict agents to their own dossiers', () => {
    const fixture = create();
    const cmp = fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('ds-switch')).not.toBeNull();

    cmp.setRestricted(true);
    const req = httpMock.expectOne(SETTINGS);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ restrictAgentsToOwnDossiers: true });
    req.flush({ restrictAgentsToOwnDossiers: true });
    expect(cmp.restricted()).toBe(true);

    cmp.setRestricted(false);
    httpMock.expectOne(SETTINGS).flush({ detail: 'ADMIN_REQUIRED' }, { status: 403, statusText: 'Forbidden' });
    expect(cmp.restricted()).toBe(true);
  });

  it('shows the visibility rule to a manager without the switch', () => {
    roles = ['MANAGER'];
    const fixture = TestBed.createComponent(TeamComponent);
    fixture.detectChanges();
    httpMock.expectOne(ALL).flush(MEMBERS);
    httpMock.expectOne(SETTINGS).flush({ restrictAgentsToOwnDossiers: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ds-switch')).toBeNull();
    expect(text(fixture.nativeElement)).toContain('ne voit que ses dossiers et ceux à attribuer');
  });
});
