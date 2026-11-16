import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { KanbanBoardComponent } from './kanban-board.component';
import {
  DossierApiService,
  DossierStatus} from '../services/dossier-api.service';
import { DsToastService } from '../design-system';

describe('KanbanBoardComponent', () => {
  let component: KanbanBoardComponent;
  let fixture: ComponentFixture<KanbanBoardComponent>;
  let mockDossierService: Pick<DossierApiService, 'patchStatus'>;
  let mockToastService: Pick<DsToastService, 'success' | 'error' | 'warning' | 'info'>;

  beforeEach(async () => {
    mockDossierService = {
      patchStatus: () =>
        of({ id: 1, status: DossierStatus.QUALIFYING, orgId: 'test' } as any)};
    mockToastService = {
      success: vi.fn().mockReturnValue(''),
      error: vi.fn().mockReturnValue(''),
      warning: vi.fn().mockReturnValue(''),
      info: vi.fn().mockReturnValue('')};

    await TestBed.configureTestingModule({
      imports: [KanbanBoardComponent],
      providers: [
        { provide: DossierApiService, useValue: mockDossierService },
        { provide: DsToastService, useValue: mockToastService }]}).compileComponents();

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
    expect(component.dsKanbanColumns.length).toBe(6);
  });

  it('should distribute dossiers to columns', () => {
    fixture.componentRef.setInput('dossiers', [
      { id: 1, status: DossierStatus.NEW, orgId: 'test' } as any,
      { id: 2, status: DossierStatus.QUALIFIED, orgId: 'test' } as any]);
    component.ngOnInit();

    const newColumn = component.columns.find((c) => c.id === DossierStatus.NEW);
    const qualifiedColumn = component.columns.find(
      (c) => c.id === DossierStatus.QUALIFIED);

    expect(newColumn?.dossiers.length).toBe(1);
    expect(qualifiedColumn?.dossiers.length).toBe(1);
    expect(
      component.dsKanbanColumns.find((c) => c.id === DossierStatus.NEW)?.cards.length).toBe(1);
  });

  it('should validate workflow transitions', () => {
    component.ngOnInit();
    const isAllowed = (component as any).isTransitionAllowed(
      DossierStatus.NEW,
      DossierStatus.QUALIFYING);
    expect(isAllowed).toBe(true);
  });

  it('should reject invalid workflow transitions', () => {
    component.ngOnInit();
    const isAllowed = (component as any).isTransitionAllowed(
      DossierStatus.WON,
      DossierStatus.NEW);
    expect(isAllowed).toBe(false);
  });

  it('should emit dossierClick event on kanban card click', () => {
    let emitted: unknown;
    const sub = component.dossierClick.subscribe((d) => {
      emitted = d;
    });
    fixture.componentRef.setInput('dossiers', [
      { id: 1, status: DossierStatus.NEW, orgId: 'test', leadName: 'Test' } as any]);
    component.ngOnInit();
    component.onKanbanCardClick({
      id: 1,
      title: 'Test',
      status: DossierStatus.NEW});
    expect((emitted as { id: number }).id).toBe(1);
    sub.unsubscribe();
  });

  it('should apply quick filter', () => {
    fixture.componentRef.setInput('dossiers', [
      {
        id: 1,
        status: DossierStatus.NEW,
        leadName: 'John Doe',
        orgId: 'test'} as any,
      {
        id: 2,
        status: DossierStatus.NEW,
        leadName: 'Jane Smith',
        orgId: 'test'} as any]);
    component.ngOnInit();
    fixture.componentRef.setInput('quickFilter', 'john');
    component.ngOnChanges({
      quickFilter: {
        currentValue: 'john',
        previousValue: '',
        firstChange: false,
        isFirstChange: () => false}});

    const newColumn = component.filteredColumns.find((c) => c.id === DossierStatus.NEW);
    expect(newColumn?.dossiers.length).toBe(1);
    expect(newColumn?.dossiers[0].leadName).toBe('John Doe');
    expect(
      component.dsKanbanColumns.find((c) => c.id === DossierStatus.NEW)?.cards.length).toBe(1);
  });
});
