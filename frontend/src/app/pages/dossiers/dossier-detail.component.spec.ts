import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DossierDetailComponent } from './dossier-detail.component';
import { DossierApiService, DossierResponse, DossierStatus } from '../../services/dossier-api.service';
import { FormsModule } from '@angular/forms';

describe('DossierDetailComponent', () => {
  let component: DossierDetailComponent;
  let fixture: ComponentFixture<DossierDetailComponent>;
  let mockDossierApiService: jasmine.SpyObj<DossierApiService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: {
    snapshot: {
      paramMap: {
        get: jasmine.Spy;
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
    updatedBy: 'user1'
  };

  beforeEach(async () => {
    mockDossierApiService = jasmine.createSpyObj('DossierApiService', ['getById', 'patchStatus']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      declarations: [ DossierDetailComponent ],
      imports: [ FormsModule ],
      providers: [
        { provide: DossierApiService, useValue: mockDossierApiService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DossierDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dossier on init', () => {
    mockDossierApiService.getById.and.returnValue(of(mockDossier));
    
    component.ngOnInit();

    expect(mockDossierApiService.getById).toHaveBeenCalledWith(1);
    expect(component.dossier).toEqual(mockDossier);
    expect(component.selectedStatus).toEqual(DossierStatus.NEW);
    expect(component.loading).toBeFalse();
  });

  it('should handle invalid ID', () => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue('invalid');
    
    component.ngOnInit();

    expect(component.error).toBe('Invalid dossier ID');
  });

  it('should handle 404 error', () => {
    mockDossierApiService.getById.and.returnValue(throwError(() => ({ status: 404 })));
    
    component.ngOnInit();

    expect(component.error).toBe('Dossier not found');
    expect(component.loading).toBeFalse();
  });

  it('should update status successfully', () => {
    component.dossier = mockDossier;
    component.selectedStatus = DossierStatus.QUALIFIED;
    const updatedDossier = { ...mockDossier, status: DossierStatus.QUALIFIED };
    mockDossierApiService.patchStatus.and.returnValue(of(updatedDossier));

    component.updateStatus();

    expect(mockDossierApiService.patchStatus).toHaveBeenCalledWith(1, DossierStatus.QUALIFIED);
    expect(component.dossier?.status).toBe(DossierStatus.QUALIFIED);
    expect(component.successMessage).toBe('Status updated successfully!');
  });

  it('should handle status update error', () => {
    component.dossier = mockDossier;
    component.selectedStatus = DossierStatus.QUALIFIED;
    mockDossierApiService.patchStatus.and.returnValue(throwError(() => new Error('Update failed')));

    component.updateStatus();

    expect(component.statusError).toBe('Failed to update status. Please try again.');
    expect(component.updatingStatus).toBeFalse();
  });

  it('should navigate back to dossiers list', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dossiers']);
  });
});
