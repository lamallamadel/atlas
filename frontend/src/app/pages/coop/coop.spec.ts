import { TestBed } from '@angular/core/testing';
import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { CoopGroupsComponent } from './coop-groups.component';
import { CoopGroupDetailComponent } from './coop-group-detail.component';
import { CoopContributionsPanelComponent, isLate } from './coop-contributions-panel.component';
import { CoopProjectsPanelComponent } from './coop-projects-panel.component';
import { CoopMembersPanelComponent } from './coop-members-panel.component';
import { AuthService } from '../../services/auth.service';
import { CoopContribution, CoopMember, toRequest } from '../../services/coop-api.service';

const url = (path: string, params: Record<string, string> = {}) => (r: HttpRequest<unknown>) =>
  r.url === `/api/v1/coop/${path}` && Object.entries(params).every(([k, v]) => r.params.get(k) === v);

const MEMBERS: CoopMember[] = [
  { id: 1, groupId: 9, firstName: 'Nadia', lastName: 'Alami', email: 'n@x.ma', status: 'ACTIVE', memberNumber: '1' },
  { id: 2, groupId: 9, firstName: 'Karim', lastName: 'Bennani', email: 'k@x.ma', status: 'PENDING', memberNumber: '2' },
];

const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, ' ');

describe('Coop screens', () => {
  let httpMock: HttpTestingController;
  let roles: string[];

  beforeEach(() => {
    roles = ['MANAGER'];
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { hasRole: (r: string) => roles.includes(r) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '9' }) } } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists groups and lets a manager create one', () => {
    const fixture = TestBed.createComponent(CoopGroupsComponent);
    fixture.detectChanges();
    httpMock.expectOne(url('groups')).flush({ content: [{ id: 9, name: 'Coop Les Oliviers', city: 'Tanger' }], totalElements: 1 });
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).toContain('Coop Les Oliviers');
    expect(fixture.nativeElement.querySelector('a.coop-card').getAttribute('href')).toBe('/pro/coop/9');

    const cmp = fixture.componentInstance;
    cmp.draft = { name: ' Coop Atlas ', city: 'Rabat', registrationNumber: '' };
    cmp.create({ invalid: false, resetForm: () => undefined } as never);
    const req = httpMock.expectOne(r => r.method === 'POST' && r.url === '/api/v1/coop/groups');
    expect(req.request.body).toEqual({ name: 'Coop Atlas', city: 'Rabat', registrationNumber: null });
    req.flush({ id: 10, name: 'Coop Atlas', city: 'Rabat' });
    expect(cmp.groups().length).toBe(2);
  });

  it('shows an agent the groups without the creation form', () => {
    roles = ['AGENT'];
    const fixture = TestBed.createComponent(CoopGroupsComponent);
    fixture.detectChanges();
    httpMock.expectOne(url('groups')).flush({ content: [], totalElements: 0 });
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).not.toContain('Nouveau groupement');
    expect(text(fixture.nativeElement)).toContain('Aucun groupement');
  });

  it('opens a group on its members', () => {
    const fixture = TestBed.createComponent(CoopGroupDetailComponent);
    fixture.detectChanges();
    httpMock.expectOne(url('groups/9')).flush({ id: 9, name: 'Coop Les Oliviers', city: 'Tanger' });
    httpMock.expectOne(url('members', { groupId: '9' })).flush({ content: MEMBERS, totalElements: 2 });
    fixture.detectChanges();
    const t = text(fixture.nativeElement);
    expect(t).toContain('Coop Les Oliviers');
    expect(t).toContain('Nadia Alami');
    expect(t).toContain('Karim Bennani');
  });

  it('adds a member as pending and changes a status', () => {
    const fixture = TestBed.createComponent(CoopMembersPanelComponent);
    fixture.componentRef.setInput('groupId', 9);
    fixture.componentRef.setInput('members', MEMBERS);
    fixture.componentRef.setInput('canEdit', true);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    let changed = 0;
    cmp.changed.subscribe(() => changed++);

    cmp.draft = { firstName: 'Salma', lastName: 'Idrissi', email: ' s@x.ma ', phone: '', memberNumber: '3' };
    cmp.add({ invalid: false, resetForm: () => undefined } as never);
    const create = httpMock.expectOne(r => r.method === 'POST' && r.url === '/api/v1/coop/members');
    expect(create.request.body).toMatchObject({ groupId: 9, firstName: 'Salma', email: 's@x.ma', status: 'PENDING', memberNumber: '3' });
    create.flush({ ...MEMBERS[0], id: 3, firstName: 'Salma', lastName: 'Idrissi' });

    cmp.setStatus(MEMBERS[1], 'ACTIVE');
    const update = httpMock.expectOne('/api/v1/coop/members/2');
    expect(update.request.body).toMatchObject({ status: 'ACTIVE', firstName: 'Karim' });
    expect(update.request.body.id).toBeUndefined();
    update.flush({ ...MEMBERS[1], status: 'ACTIVE' });
    expect(changed).toBe(2);
  });

  it('sums the contributions ledger and marks one paid', () => {
    const fixture = TestBed.createComponent(CoopContributionsPanelComponent);
    fixture.componentRef.setInput('groupId', 9);
    fixture.componentRef.setInput('members', MEMBERS);
    fixture.componentRef.setInput('canEdit', true);
    fixture.detectChanges();
    const ledger: CoopContribution[] = [
      { id: 1, memberId: 1, type: 'INITIAL', amount: 50000, currency: 'MAD', status: 'PAID', dueDate: '2026-01-10' },
      { id: 2, memberId: 2, type: 'INITIAL', amount: 50000, currency: 'MAD', status: 'PENDING', dueDate: '2020-01-10' },
      { id: 3, memberId: 2, type: 'MONTHLY', amount: 2000, currency: 'MAD', status: 'PENDING', dueDate: '2099-01-10' },
      { id: 4, memberId: 1, type: 'SPECIAL', amount: 9999, currency: 'MAD', status: 'CANCELLED' },
    ];
    httpMock.expectOne(url('contributions', { groupId: '9' })).flush({ content: ledger, totalElements: 4 });
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(cmp.totals()).toEqual({ called: 102000, paid: 50000, due: 2000, late: 50000 });
    expect(text(fixture.nativeElement)).toContain('Karim Bennani');
    expect(text(fixture.nativeElement)).toContain('En retard');

    cmp.markPaid(ledger[1]);
    const req = httpMock.expectOne('/api/v1/coop/contributions/2');
    expect(req.request.body).toMatchObject({ status: 'PAID', amount: 50000, memberId: 2 });
    expect(req.request.body.paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    req.flush({ ...ledger[1], status: 'PAID', paymentDate: '2026-11-24' });
    expect(cmp.totals().late).toBe(0);
  });

  it('assigns a lot to a member, which reserves it', () => {
    const fixture = TestBed.createComponent(CoopProjectsPanelComponent);
    fixture.componentRef.setInput('groupId', 9);
    fixture.componentRef.setInput('members', MEMBERS);
    fixture.componentRef.setInput('canEdit', true);
    fixture.detectChanges();
    httpMock.expectOne(url('projects', { groupId: '9' })).flush({
      content: [{ id: 5, groupId: 9, name: 'Résidence Oliviers', status: 'PLANNING', totalBudget: 12000000, currency: 'MAD' }],
      totalElements: 1,
    });
    httpMock.expectOne(url('lots', { projectId: '5' })).flush({
      content: [{ id: 7, projectId: 5, lotNumber: 'A1', status: 'AVAILABLE', surfaceArea: 92 }],
      totalElements: 1,
    });
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    expect(text(fixture.nativeElement)).toContain('1 lot(s), 0 attribué(s)');

    cmp.assign(cmp.lotsOf(5)[0], 1);
    const req = httpMock.expectOne('/api/v1/coop/lots/7');
    expect(req.request.body).toMatchObject({ memberId: 1, status: 'RESERVED', lotNumber: 'A1' });
    req.flush({ id: 7, projectId: 5, lotNumber: 'A1', status: 'RESERVED', memberId: 1 });
    expect(cmp.assignedCount(5)).toBe(1);
  });

  it('flags late contributions and strips ids from update bodies', () => {
    const c = { id: 1, memberId: 1, type: 'MONTHLY', amount: 1, currency: 'MAD', status: 'PENDING', dueDate: '2026-01-01' } as CoopContribution;
    expect(isLate(c, '2026-02-01')).toBe(true);
    expect(isLate(c, '2025-12-01')).toBe(false);
    expect(toRequest({ ...c, createdAt: 'x' } as CoopContribution)).not.toHaveProperty('id');
  });
});
