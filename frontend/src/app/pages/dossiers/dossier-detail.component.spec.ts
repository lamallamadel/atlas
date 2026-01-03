// FE/src/app/pages/dossiers/dossier-detail.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { DossierDetailComponent } from './dossier-detail.component';
import { DossierApiService, DossierResponse, DossierStatus } from '../../services/dossier-api.service';

describe('DossierDetailComponent', () => {
  let component: DossierDetailComponent;
  let fixture: ComponentFixture<DossierDetailComponent>;

  let dossierApiService: jasmine.SpyObj<DossierApiService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

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
    updatedBy: 'user1'
  };

  beforeEach(async () => {
    dossierApiService = jasmine.createSpyObj<DossierApiService>('DossierApiService', ['getById', 'patchStatus', 'patchLead']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    activatedRouteStub = {
      snapshot: {
        paramMap: { get: jasmine.createSpy('get').and.returnValue('1') }
      }
    };

    await TestBed.configureTestingModule({
      declarations: [DossierDetailComponent],
      providers: [
        { provide: DossierApiService, useValue: dossierApiService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: MatSnackBar, useValue: snackBar }
      ]
    })
      .overrideTemplate(DossierDetailComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(DossierDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dossier on init (ngOnInit -> loadDossier)', () => {
    dossierApiService.getById.and.returnValue(of(mockDossier));

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
});
