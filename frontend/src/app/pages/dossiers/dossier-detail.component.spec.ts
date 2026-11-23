import type { Mock } from 'vitest';
import { Component, NO_ERRORS_SCHEMA, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { DsToastService, DsDialogService } from '../../design-system';

import { DossierDetailComponent } from './dossier-detail.component';
import { RecentNavigationService } from '../../services/recent-navigation.service';
import { CollaborationService } from '../../services/collaboration.service';
import {
  DossierApiService,
  DossierResponse,
  DossierStatus} from '../../services/dossier-api.service';
import { PartiePrenanteApiService } from '../../services/partie-prenante-api.service';
import { MessageApiService } from '../../services/message-api.service';
import { AppointmentApiService } from '../../services/appointment-api.service';
import { ConsentementApiService } from '../../services/consentement-api.service';
import { AuditEventApiService } from '../../services/audit-event-api.service';
import { CommonTestingModule } from '../../testing/common-testing.module';
import { PhoneFormatPipe } from '../../pipes/phone-format.pipe';

@Component({
  selector: 'app-badge-status',
  template: '',
  imports: [
    CommonTestingModule, // centralized: animations + forms + http testing
  ]})
class BadgeStatusStubComponent {
  readonly status = input<any>();
}

describe('DossierDetailComponent', () => {
  let component: DossierDetailComponent;
  let fixture: ComponentFixture<DossierDetailComponent>;

  let dossierApiService: AngularVitestPartialMock<DossierApiService>;
  let partiePrenanteApiService: AngularVitestPartialMock<PartiePrenanteApiService>;
  let messageApiService: AngularVitestPartialMock<MessageApiService>;
  let appointmentApiService: AngularVitestPartialMock<AppointmentApiService>;
  let consentementApiService: AngularVitestPartialMock<ConsentementApiService>;
  let auditEventApiService: AngularVitestPartialMock<AuditEventApiService>;
  let router: AngularVitestPartialMock<Router>;
  let toastService: AngularVitestPartialMock<DsToastService>;

  let activatedRouteStub: {
    snapshot: {
      paramMap: {
        get: Mock;
      };
    };
  };

  const mockDossier: DossierResponse = {
    id: 1,
    orgId: 'ORG123',
    annonceId: 10,
    leadPhone: '+33612345678',
    leadName: 'John Doe',
    leadSource: 'Website',
    status: DossierStatus.NEW,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: 'user1',
    updatedBy: 'user1',
    parties: []};

  const mockMessagesPage: any = {
    content: [],
    pageable: {
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 100,
      paged: true,
      unpaged: false},
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 100,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    numberOfElements: 0,
    empty: true};

  const mockAppointmentsPage: any = {
    content: [],
    pageable: {
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 100,
      paged: true,
      unpaged: false},
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 100,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    numberOfElements: 0,
    empty: true};

  const mockConsentementsPage: any = {
    content: [],
    pageable: {
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 100,
      paged: true,
      unpaged: false},
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 100,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    numberOfElements: 0,
    empty: true};

  const mockAuditEventsPage: any = {
    content: [],
    pageable: {
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 10,
      paged: true,
      unpaged: false},
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 10,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    numberOfElements: 0,
    empty: true};

  beforeEach(async () => {
    dossierApiService = {
      getById: vi.fn().mockName('DossierApiService.getById'),
      patchStatus: vi.fn().mockName('DossierApiService.patchStatus'),
      patchLead: vi.fn().mockName('DossierApiService.patchLead')};
    partiePrenanteApiService = {
      list: vi.fn().mockName('PartiePrenanteApiService.list'),
      create: vi.fn().mockName('PartiePrenanteApiService.create'),
      update: vi.fn().mockName('PartiePrenanteApiService.update'),
      delete: vi.fn().mockName('PartiePrenanteApiService.delete')};
    messageApiService = {
      list: vi.fn().mockName('MessageApiService.list'),
      create: vi.fn().mockName('MessageApiService.create')};
    appointmentApiService = {
      list: vi.fn().mockName('AppointmentApiService.list'),
      create: vi.fn().mockName('AppointmentApiService.create'),
      update: vi.fn().mockName('AppointmentApiService.update'),
      delete: vi.fn().mockName('AppointmentApiService.delete')};
    consentementApiService = {
      list: vi.fn().mockName('ConsentementApiService.list'),
      create: vi.fn().mockName('ConsentementApiService.create'),
      update: vi.fn().mockName('ConsentementApiService.update'),
      delete: vi.fn().mockName('ConsentementApiService.delete')};
    auditEventApiService = {
      list: vi.fn().mockName('AuditEventApiService.list'),
      listByDossier: vi.fn().mockName('AuditEventApiService.listByDossier'),
      create: vi.fn().mockName('AuditEventApiService.create')};
    router = {
      navigate: vi.fn().mockName('Router.navigate'),
      createUrlTree: vi.fn().mockName('Router.createUrlTree'),
      serializeUrl: vi.fn().mockName('Router.serializeUrl'),
      events: EMPTY};
    router.createUrlTree.mockReturnValue({} as any);
    router.serializeUrl.mockReturnValue('');
    toastService = {
      success: vi.fn().mockName('DsToastService.success'),
      error: vi.fn().mockName('DsToastService.error'),
      info: vi.fn().mockName('DsToastService.info'),
      warning: vi.fn().mockName('DsToastService.warning')};

    activatedRouteStub = {
      snapshot: {
        paramMap: { get: vi.fn().mockReturnValue('1') }}};

    await TestBed.configureTestingModule({
      imports: [
        CommonTestingModule, // centralized: animations + forms + http testing
        DossierDetailComponent,
        BadgeStatusStubComponent,
        PhoneFormatPipe],
      providers: [
        { provide: DossierApiService, useValue: dossierApiService },
        {
          provide: PartiePrenanteApiService,
          useValue: partiePrenanteApiService},
        { provide: MessageApiService, useValue: messageApiService },
        { provide: AppointmentApiService, useValue: appointmentApiService },
        { provide: ConsentementApiService, useValue: consentementApiService },
        { provide: AuditEventApiService, useValue: auditEventApiService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: DsToastService, useValue: toastService },
        { provide: DsDialogService, useValue: { open: vi.fn().mockReturnValue({ closed: EMPTY }) } },
        {
          provide: RecentNavigationService,
          useValue: {
            addRecentItem: vi
              .fn()
              .mockName('RecentNavigationService.addRecentItem')}},
        {
          provide: CollaborationService,
          useValue: {
            initializeForDossier: vi.fn().mockResolvedValue(undefined),
            leaveDossier: vi.fn(),
            getEditUpdates: vi.fn().mockReturnValue(EMPTY),
            getActivityUpdates: vi.fn().mockReturnValue(EMPTY),
            updateCursor: vi.fn(),
            broadcastEdit: vi.fn()}}],
      // If more unknown components appear in template, this prevents NG0304 noise.
      schemas: [NO_ERRORS_SCHEMA]}).compileComponents();

    fixture = TestBed.createComponent(DossierDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dossier on init (ngOnInit -> loadDossier)', () => {
    dossierApiService.getById.mockReturnValue(of(mockDossier));
    messageApiService.list.mockReturnValue(of(mockMessagesPage));
    appointmentApiService.list.mockReturnValue(of(mockAppointmentsPage));
    consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.mockReturnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(dossierApiService.getById).toHaveBeenCalledWith(1);
    expect(component.dossier).toEqual(mockDossier);
    expect(component.selectedStatus).toEqual(DossierStatus.NEW);
    expect(component.loading).toBe(false);
  });

  it('should handle invalid dossier ID (NaN)', () => {
    activatedRouteStub.snapshot.paramMap.get.mockReturnValue('invalid');

    fixture.detectChanges();

    expect(component.error).toBe('ID invalide');
    expect(dossierApiService.getById).not.toHaveBeenCalled();
  });

  it('should handle 404 on load', () => {
    dossierApiService.getById.mockReturnValue(
      throwError(() => ({ status: 404 }))
    );
    messageApiService.list.mockReturnValue(of(mockMessagesPage));
    appointmentApiService.list.mockReturnValue(of(mockAppointmentsPage));
    consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.mockReturnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(component.error).toBe('Dossier introuvable');
    expect(component.loading).toBe(false);
  });

  it('should not call patchStatus if selectedStatus equals current dossier status', () => {
    component.dossier = { ...mockDossier, status: DossierStatus.NEW };
    component.selectedStatus = DossierStatus.NEW;

    component.updateStatus();

    expect(dossierApiService.patchStatus).not.toHaveBeenCalled();
  });

  it('should patch status and reload dossier on success', () => {
    const afterReload: DossierResponse = {
      ...mockDossier,
      status: DossierStatus.QUALIFIED};

    dossierApiService.getById
      .mockReturnValueOnce(of(mockDossier))
      .mockReturnValueOnce(of(afterReload));
    dossierApiService.patchStatus.mockReturnValue(of(afterReload));
    messageApiService.list.mockReturnValue(of(mockMessagesPage));
    appointmentApiService.list.mockReturnValue(of(mockAppointmentsPage));
    consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.mockReturnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    component.dossier = mockDossier;
    component.selectedStatus = DossierStatus.QUALIFIED;

    component.updateStatus();

    expect(dossierApiService.patchStatus).toHaveBeenCalledWith(
      1,
      DossierStatus.QUALIFIED
    );
    expect(toastService.success).toHaveBeenCalled();
    expect(dossierApiService.getById).toHaveBeenCalledTimes(2);
  });

  it('should show snackbar error if patchStatus fails', () => {
    dossierApiService.getById.mockReturnValue(of(mockDossier));
    dossierApiService.patchStatus.mockReturnValue(
      throwError(() => ({ error: { message: 'Update failed' } }))
    );
    messageApiService.list.mockReturnValue(of(mockMessagesPage));
    appointmentApiService.list.mockReturnValue(of(mockAppointmentsPage));
    consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.mockReturnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    component.dossier = mockDossier;
    component.selectedStatus = DossierStatus.QUALIFIED;
    component.updateStatus();

    expect(dossierApiService.patchStatus).toHaveBeenCalledWith(
      1,
      DossierStatus.QUALIFIED
    );
    expect(toastService.error).toHaveBeenCalledWith('Update failed');
    expect(component.updatingStatus).toBe(false);
  });

  it('should navigate back to dossiers list', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/dossiers']);
  });

  it('should render tabs in the template', () => {
    dossierApiService.getById.mockReturnValue(of(mockDossier));
    messageApiService.list.mockReturnValue(of(mockMessagesPage));
    appointmentApiService.list.mockReturnValue(of(mockAppointmentsPage));
    consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.mockReturnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    // Angular Material MDC tabs render labels with role="tab"
    const tabs = compiled.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('should call MessageApiService.list on component initialization', () => {
    dossierApiService.getById.mockReturnValue(of(mockDossier));
    messageApiService.list.mockReturnValue(of(mockMessagesPage));
    appointmentApiService.list.mockReturnValue(of(mockAppointmentsPage));
    consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.mockReturnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(messageApiService.list).toHaveBeenCalledWith({
      dossierId: 1,
      size: 100,
      sort: 'timestamp,desc'});
  });

  it('should call AppointmentApiService.list on component initialization', () => {
    dossierApiService.getById.mockReturnValue(of(mockDossier));
    messageApiService.list.mockReturnValue(of(mockMessagesPage));
    appointmentApiService.list.mockReturnValue(of(mockAppointmentsPage));
    consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.mockReturnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(appointmentApiService.list).toHaveBeenCalledWith({
      dossierId: 1,
      size: 100,
      sort: 'startTime,desc'});
  });

  it('should call ConsentementApiService.list on component initialization', () => {
    dossierApiService.getById.mockReturnValue(of(mockDossier));
    messageApiService.list.mockReturnValue(of(mockMessagesPage));
    appointmentApiService.list.mockReturnValue(of(mockAppointmentsPage));
    consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.mockReturnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(consentementApiService.list).toHaveBeenCalledWith({
      dossierId: 1,
      size: 100,
      sort: 'updatedAt,desc'});
  });

  it('should call AuditEventApiService.listByDossier on component initialization', () => {
    dossierApiService.getById.mockReturnValue(of(mockDossier));
    messageApiService.list.mockReturnValue(of(mockMessagesPage));
    appointmentApiService.list.mockReturnValue(of(mockAppointmentsPage));
    consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.mockReturnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(auditEventApiService.listByDossier).toHaveBeenCalledWith(1, {
      page: 0,
      size: 10,
      sort: 'createdAt,desc'});
  });
  describe('consentements : saisie agent et confirmation client', () => {
    const at = (iso: string) => iso;
    function consent(p: any) {
      return { id: p.id ?? 1, orgId: 'ORG', dossierId: 1, channel: 'WHATSAPP', consentType: 'MARKETING', status: 'GRANTED',
        meta: {}, createdAt: at('2026-11-20T10:00:00'), updatedAt: at('2026-11-20T10:00:00'), ...p };
    }

    it('accord de prospection noté par l’agent : à confirmer par le client', () => {
      component.consentements = [consent({ meta: { source: 'AGENT', method: 'PHONE_CALL', recordedBy: 'adel' } })] as any;
      expect(component.needsClientConfirmation('WHATSAPP' as any)).toBe(true);
      expect(component.consentSourceLabel(component.latestConsent('WHATSAPP' as any, 'MARKETING'))).toBe('noté par adel — au téléphone');
    });

    it('accord confirmé par le lien : plus rien à confirmer', () => {
      component.consentements = [consent({ meta: { source: 'CLIENT_LINK', doubleOptInConfirmed: true } })] as any;
      expect(component.needsClientConfirmation('WHATSAPP' as any)).toBe(false);
      expect(component.consentSourceLabel(component.latestConsent('WHATSAPP' as any, 'MARKETING'))).toBe('confirmé par le client');
    });

    it('le dernier consentement l’emporte ; seul un refus ou un retrait bloque la réponse WhatsApp', () => {
      component.consentements = [
        consent({ id: 1, consentType: 'TRANSACTIONNEL', status: 'GRANTED', updatedAt: '2026-11-19T10:00:00' }),
        consent({ id: 2, consentType: 'TRANSACTIONNEL', status: 'REVOKED', updatedAt: '2026-11-20T10:00:00' }),
      ] as any;
      expect(component.canReplyOnWhatsApp()).toBe(false); // retrait explicite : bloqué
      component.consentements = [] as any;
      expect(component.canReplyOnWhatsApp()).toBe(true);  // client qui écrit en premier : réponse possible
      component.consentements = [consent({ id: 4, consentType: 'TRANSACTIONNEL' })] as any;
      expect(component.canReplyOnWhatsApp()).toBe(true);
    });

    it('la saisie agent envoie la finalité, la source et le mode', () => {
      component.dossier = { ...mockDossier, id: 7 } as any;
      consentementApiService.create.mockReturnValue(of({} as any));
      consentementApiService.list.mockReturnValue(of(mockConsentementsPage));
      component.recordForm = { channel: 'WHATSAPP' as any, purpose: 'TRANSACTIONNEL', decision: 'GRANTED' as any, method: 'IN_PERSON', note: ' visite du 20/11 ' };
      component.saveAgentConsent();
      expect(consentementApiService.create).toHaveBeenCalledWith({
        dossierId: 7, channel: 'WHATSAPP', consentType: 'TRANSACTIONNEL', status: 'GRANTED',
        meta: { source: 'AGENT', method: 'IN_PERSON', note: 'visite du 20/11' },
      });
      expect(toastService.success).toHaveBeenCalledWith('Consentement enregistré');
    });
  });
});
