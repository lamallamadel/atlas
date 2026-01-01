import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AnnonceDetailComponent } from './annonce-detail.component';
import { AnnonceApiService, AnnonceResponse, AnnonceStatus } from '../../services/annonce-api.service';

describe('AnnonceDetailComponent', () => {
  let component: AnnonceDetailComponent;
  let fixture: ComponentFixture<AnnonceDetailComponent>;
  let mockAnnonceApiService: jasmine.SpyObj<AnnonceApiService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: {
    snapshot: {
      paramMap: {
        get: jasmine.Spy;
      };
    };
  };

  const mockAnnonce: AnnonceResponse = {
    id: 1,
    orgId: 'ORG-001',
    title: 'Test Annonce',
    description: 'Test Description',
    category: 'Test Category',
    city: 'Test City',
    price: 100.50,
    currency: 'EUR',
    status: AnnonceStatus.PUBLISHED,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-02T10:00:00Z',
    createdBy: 'user1',
    updatedBy: 'user1'
  };

  beforeEach(async () => {
    mockAnnonceApiService = jasmine.createSpyObj('AnnonceApiService', ['getById']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      declarations: [ AnnonceDetailComponent ],
      providers: [
        { provide: AnnonceApiService, useValue: mockAnnonceApiService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnonceDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load annonce on init', () => {
    mockAnnonceApiService.getById.and.returnValue(of(mockAnnonce));

    component.ngOnInit();

    expect(mockAnnonceApiService.getById).toHaveBeenCalledWith(1);
    expect(component.annonce).toEqual(mockAnnonce);
    expect(component.loading).toBe(false);
    expect(component.error).toBeNull();
  });

  it('should handle error when loading annonce', () => {
    mockAnnonceApiService.getById.and.returnValue(throwError(() => ({ status: 500 })));

    component.ngOnInit();

    expect(component.annonce).toBeNull();
    expect(component.loading).toBe(false);
    expect(component.error).toBe('Failed to load annonce. Please try again.');
  });

  it('should handle 404 error', () => {
    mockAnnonceApiService.getById.and.returnValue(throwError(() => ({ status: 404 })));

    component.ngOnInit();

    expect(component.error).toBe('Annonce not found');
  });

  it('should navigate to edit page', () => {
    component.annonce = mockAnnonce;

    component.editAnnonce();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/annonces', 1, 'edit']);
  });

  it('should navigate back to annonces list', () => {
    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/annonces']);
  });

  it('should handle invalid annonce ID', () => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue('invalid');

    component.loadAnnonce();

    expect(component.error).toBe('Invalid annonce ID');
  });

  it('should handle missing annonce ID', () => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

    component.loadAnnonce();

    expect(component.error).toBe('Invalid annonce ID');
  });
});
