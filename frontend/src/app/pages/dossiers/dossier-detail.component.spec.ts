import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { DossierDetailComponent } from './dossier-detail.component';
import { DossierApiService, DossierResponse, DossierStatus } from '../../services/dossier-api.service';
import { PartiePrenanteApiService } from '../../services/partie-prenante-api.service';
import { MessageApiService } from '../../services/message-api.service';
import { AppointmentApiService } from '../../services/appointment-api.service';
import { ConsentementApiService } from '../../services/consentement-api.service';
import { AuditEventApiService } from '../../services/audit-event-api.service';

describe('DossierDetailComponent', () => {
  let component: DossierDetailComponent;
  let fixture: ComponentFixture<DossierDetailComponent>;

  let dossierApiService: jasmine.SpyObj<DossierApiService>;
  let partiePrenanteApiService: jasmine.SpyObj<PartiePrenanteApiService>;
  let messageApiService: jasmine.SpyObj<MessageApiService>;
  let appointmentApiService: jasmine.SpyObj<AppointmentApiService>;
  let consentementApiService: jasmine.SpyObj<ConsentementApiService>;
  let auditEventApiService: jasmine.SpyObj<AuditEventApiService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;

  let activatedRouteStub: {
    snapshot: {
      paramMap: { get: jasmine.Spy };
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
    parties: []
  };

  const mockMessagesPage: any = {
    content: [],
    pageable: {
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 100,
      paged: true,
      unpaged: false
    },
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 100,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    numberOfElements: 0,
    empty: true
  };

  const mockAppointmentsPage: any = {
    content: [],
    pageable: {
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 100,
      paged: true,
      unpaged: false
    },
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 100,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    numberOfElements: 0,
    empty: true
  };

  const mockConsentementsPage: any = {
    content: [],
    pageable: {
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 100,
      paged: true,
      unpaged: false
    },
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 100,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    numberOfElements: 0,
    empty: true
  };

  const mockAuditEventsPage: any = {
    content: [],
    pageable: {
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 10,
      paged: true,
      unpaged: false
    },
    last: true,
    totalPages: 1,
    totalElements: 0,
    size: 10,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    first: true,
    numberOfElements: 0,
    empty: true
  };

  beforeEach(async () => {
    dossierApiService = jasmine.createSpyObj<DossierApiService>('DossierApiService', ['getById', 'patchStatus', 'patchLead']);
    partiePrenanteApiService = jasmine.createSpyObj<PartiePrenanteApiService>('PartiePrenanteApiService', ['list', 'create', 'update', 'delete']);
    messageApiService = jasmine.createSpyObj<MessageApiService>('MessageApiService', ['list', 'create']);
    appointmentApiService = jasmine.createSpyObj<AppointmentApiService>('AppointmentApiService', ['list', 'create', 'update', 'delete']);
    consentementApiService = jasmine.createSpyObj<ConsentementApiService>('ConsentementApiService', ['list', 'create', 'update', 'delete']);
    auditEventApiService = jasmine.createSpyObj<AuditEventApiService>('AuditEventApiService', ['list', 'listByDossier', 'create']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    activatedRouteStub = {
      snapshot: {
        paramMap: { get: jasmine.createSpy('get').and.returnValue('1') }
      }
    };

    await TestBed.configureTestingModule({
      declarations: [DossierDetailComponent],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatTabsModule,
        MatCardModule,
        MatExpansionModule,
        MatPaginatorModule
      ],
      providers: [
        { provide: DossierApiService, useValue: dossierApiService },
        { provide: PartiePrenanteApiService, useValue: partiePrenanteApiService },
        { provide: MessageApiService, useValue: messageApiService },
        { provide: AppointmentApiService, useValue: appointmentApiService },
        { provide: ConsentementApiService, useValue: consentementApiService },
        { provide: AuditEventApiService, useValue: auditEventApiService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DossierDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dossier on init (ngOnInit -> loadDossier)', () => {
    dossierApiService.getById.and.returnValue(of(mockDossier));
    messageApiService.list.and.returnValue(of(mockMessagesPage));
    appointmentApiService.list.and.returnValue(of(mockAppointmentsPage));
    consentementApiService.list.and.returnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.and.returnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(dossierApiService.getById).toHaveBeenCalledWith(1);
    expect(component.dossier).toEqual(mockDossier);
    expect(component.selectedStatus).toEqual(DossierStatus.NEW);
    expect(component.loading).toBeFalse();
  });

  it('should handle invalid dossier ID (NaN)', () => {
    activatedRouteStub.snapshot.paramMap.get.and.returnValue('invalid');

    fixture.detectChanges();

    expect(component.error).toBe('ID de dossier invalide');
    expect(dossierApiService.getById).not.toHaveBeenCalled();
  });

  it('should handle 404 on load', () => {
    dossierApiService.getById.and.returnValue(throwError(() => ({ status: 404 })));
    messageApiService.list.and.returnValue(of(mockMessagesPage));
    appointmentApiService.list.and.returnValue(of(mockAppointmentsPage));
    consentementApiService.list.and.returnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.and.returnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(component.error).toBe('Dossier introuvable');
    expect(component.loading).toBeFalse();
  });

  it('should not call patchStatus if selectedStatus equals current dossier status', () => {
    component.dossier = { ...mockDossier, status: DossierStatus.NEW };
    component.selectedStatus = DossierStatus.NEW;

    component.updateStatus();

    expect(dossierApiService.patchStatus).not.toHaveBeenCalled();
    expect(component.statusError).toBe('Le statut est déjà défini à cette valeur');
  });

  it('should patch status and reload dossier on success', () => {
    const afterReload: DossierResponse = { ...mockDossier, status: DossierStatus.QUALIFIED };

    dossierApiService.getById.and.returnValues(of(mockDossier), of(afterReload));
    dossierApiService.patchStatus.and.returnValue(of(afterReload));
    messageApiService.list.and.returnValue(of(mockMessagesPage));
    appointmentApiService.list.and.returnValue(of(mockAppointmentsPage));
    consentementApiService.list.and.returnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.and.returnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    component.dossier = mockDossier;
    component.selectedStatus = DossierStatus.QUALIFIED;

    component.updateStatus();

    expect(dossierApiService.patchStatus).toHaveBeenCalledWith(1, DossierStatus.QUALIFIED);
    expect(snackBar.open).toHaveBeenCalled();
    expect(dossierApiService.getById).toHaveBeenCalledTimes(2);
  });

  it('should show snackbar error if patchStatus fails', () => {
    dossierApiService.getById.and.returnValue(of(mockDossier));
    dossierApiService.patchStatus.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));
    messageApiService.list.and.returnValue(of(mockMessagesPage));
    appointmentApiService.list.and.returnValue(of(mockAppointmentsPage));
    consentementApiService.list.and.returnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.and.returnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    component.dossier = mockDossier;
    component.selectedStatus = DossierStatus.QUALIFIED;
    component.updateStatus();

    expect(dossierApiService.patchStatus).toHaveBeenCalledWith(1, DossierStatus.QUALIFIED);
    expect(snackBar.open).toHaveBeenCalledWith('Update failed', 'Fermer', jasmine.any(Object));
    expect(component.updatingStatus).toBeFalse();
  });

  it('should navigate back to dossiers list', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/dossiers']);
  });

  it('should render tabs in the template', () => {
    dossierApiService.getById.and.returnValue(of(mockDossier));
    messageApiService.list.and.returnValue(of(mockMessagesPage));
    appointmentApiService.list.and.returnValue(of(mockAppointmentsPage));
    consentementApiService.list.and.returnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.and.returnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const tabLabels = compiled.querySelectorAll('.mat-mdc-tab');

    expect(tabLabels.length).toBeGreaterThan(0);
  });

  it('should call MessageApiService.list on component initialization', () => {
    dossierApiService.getById.and.returnValue(of(mockDossier));
    messageApiService.list.and.returnValue(of(mockMessagesPage));
    appointmentApiService.list.and.returnValue(of(mockAppointmentsPage));
    consentementApiService.list.and.returnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.and.returnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(messageApiService.list).toHaveBeenCalledWith({
      dossierId: 1,
      size: 100,
      sort: 'timestamp,desc'
    });
  });

  it('should call AppointmentApiService.list on component initialization', () => {
    dossierApiService.getById.and.returnValue(of(mockDossier));
    messageApiService.list.and.returnValue(of(mockMessagesPage));
    appointmentApiService.list.and.returnValue(of(mockAppointmentsPage));
    consentementApiService.list.and.returnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.and.returnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(appointmentApiService.list).toHaveBeenCalledWith({
      dossierId: 1,
      size: 100,
      sort: 'startTime,desc'
    });
  });

  it('should call ConsentementApiService.list on component initialization', () => {
    dossierApiService.getById.and.returnValue(of(mockDossier));
    messageApiService.list.and.returnValue(of(mockMessagesPage));
    appointmentApiService.list.and.returnValue(of(mockAppointmentsPage));
    consentementApiService.list.and.returnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.and.returnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(consentementApiService.list).toHaveBeenCalledWith({
      dossierId: 1,
      size: 100,
      sort: 'updatedAt,desc'
    });
  });

  it('should call AuditEventApiService.listByDossier on component initialization', () => {
    dossierApiService.getById.and.returnValue(of(mockDossier));
    messageApiService.list.and.returnValue(of(mockMessagesPage));
    appointmentApiService.list.and.returnValue(of(mockAppointmentsPage));
    consentementApiService.list.and.returnValue(of(mockConsentementsPage));
    auditEventApiService.listByDossier.and.returnValue(of(mockAuditEventsPage));

    fixture.detectChanges();

    expect(auditEventApiService.listByDossier).toHaveBeenCalledWith(1, {
      page: 0,
      size: 10,
      sort: 'createdAt,desc'
    });
  });
});
