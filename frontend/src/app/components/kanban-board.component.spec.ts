import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanBoardComponent } from './kanban-board.component';
import { DossierApiService, DossierStatus } from '../services/dossier-api.service';
import { ToastNotificationService } from '../services/toast-notification.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

describe('KanbanBoardComponent', () => {
  let component: KanbanBoardComponent;
  let fixture: ComponentFixture<KanbanBoardComponent>;
  let mockDossierService: jasmine.SpyObj<DossierApiService>;
  let mockToastService: jasmine.SpyObj<ToastNotificationService>;

  beforeEach(async () => {
    mockDossierService = jasmine.createSpyObj('DossierApiService', ['patchStatus']);
    mockToastService = jasmine.createSpyObj('ToastNotificationService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      declarations: [KanbanBoardComponent],
      imports: [DragDropModule, MatIconModule, MatProgressSpinnerModule],
      providers: [
        { provide: DossierApiService, useValue: mockDossierService },
        { provide: ToastNotificationService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanBoardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize columns on ngOnInit', () => {
    component.ngOnInit();
    expect(component.columns.length).toBe(6);
    expect(component.columns[0].id).toBe(DossierStatus.NEW);
    expect(component.columns[5].id).toBe(DossierStatus.LOST);
  });

  it('should distribute dossiers to columns', () => {
    component.dossiers = [
      { id: 1, status: DossierStatus.NEW, orgId: 'test' } as any,
      { id: 2, status: DossierStatus.QUALIFIED, orgId: 'test' } as any
    ];
    component.ngOnInit();

    const newColumn = component.columns.find(c => c.id === DossierStatus.NEW);
    const qualifiedColumn = component.columns.find(c => c.id === DossierStatus.QUALIFIED);

    expect(newColumn?.dossiers.length).toBe(1);
    expect(qualifiedColumn?.dossiers.length).toBe(1);
  });

  it('should validate workflow transitions', () => {
    component.ngOnInit();
    const isAllowed = (component as any).isTransitionAllowed(DossierStatus.NEW, DossierStatus.QUALIFYING);
    expect(isAllowed).toBe(true);
  });

  it('should reject invalid workflow transitions', () => {
    component.ngOnInit();
    const isAllowed = (component as any).isTransitionAllowed(DossierStatus.WON, DossierStatus.NEW);
    expect(isAllowed).toBe(false);
  });

  it('should emit dossierClick event on card click', () => {
    spyOn(component.dossierClick, 'emit');
    const dossier = { id: 1, status: DossierStatus.NEW } as any;
    component.onCardClick(dossier);
    expect(component.dossierClick.emit).toHaveBeenCalledWith(dossier);
  });

  it('should apply quick filter', () => {
    component.dossiers = [
      { id: 1, status: DossierStatus.NEW, leadName: 'John Doe', orgId: 'test' } as any,
      { id: 2, status: DossierStatus.NEW, leadName: 'Jane Smith', orgId: 'test' } as any
    ];
    component.ngOnInit();
    component.quickFilter = 'john';
    component.ngOnChanges({ quickFilter: { currentValue: 'john', previousValue: '', firstChange: false, isFirstChange: () => false } });

    const newColumn = component.filteredColumns.find(c => c.id === DossierStatus.NEW);
    expect(newColumn?.dossiers.length).toBe(1);
    expect(newColumn?.dossiers[0].leadName).toBe('John Doe');
  });
});
