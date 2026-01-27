import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CustomizableDashboardComponent } from './customizable-dashboard.component';
import { DashboardCustomizationService } from '../services/dashboard-customization.service';
import { of } from 'rxjs';

describe('CustomizableDashboardComponent', () => {
  let component: CustomizableDashboardComponent;
  let fixture: ComponentFixture<CustomizableDashboardComponent>;
  let customizationService: jasmine.SpyObj<DashboardCustomizationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('DashboardCustomizationService', [
      'getUserPreferences',
      'updateDashboardLayout',
      'applyRoleTemplate',
      'exportConfiguration',
      'importConfiguration',
      'addWidget',
      'removeWidget',
      'updateWidget',
      'setEditMode',
      'getAvailableTemplates'
    ], {
      layout$: of({ widgets: [] }),
      editMode$: of(false)
    });

    serviceSpy.getAvailableTemplates.and.returnValue([
      {
        id: 'agent',
        name: 'Agent Dashboard',
        description: 'For agents',
        role: 'agent',
        layout: { widgets: [] }
      }
    ]);

    await TestBed.configureTestingModule({
      imports: [CustomizableDashboardComponent, HttpClientTestingModule],
      providers: [
        { provide: DashboardCustomizationService, useValue: serviceSpy }
      ]
    }).compileComponents();

    customizationService = TestBed.inject(DashboardCustomizationService) as jasmine.SpyObj<DashboardCustomizationService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomizableDashboardComponent);
    component = fixture.componentInstance;
    customizationService.getUserPreferences.and.returnValue(of({
      userId: 'test-user',
      dashboardLayout: { widgets: [] }
    }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user dashboard on init', () => {
    fixture.detectChanges();
    expect(customizationService.getUserPreferences).toHaveBeenCalled();
  });

  it('should toggle edit mode', () => {
    component.editMode = false;
    component.toggleEditMode();
    expect(component.editMode).toBe(true);
    expect(customizationService.setEditMode).toHaveBeenCalledWith(true);
  });

  it('should remove widget', () => {
    component.removeWidget('widget-1');
    expect(customizationService.removeWidget).toHaveBeenCalledWith('widget-1');
  });

  it('should apply template', () => {
    customizationService.applyRoleTemplate.and.returnValue(of({
      userId: 'test-user',
      roleTemplate: 'agent'
    }));

    component.applyTemplate('agent');
    expect(customizationService.applyRoleTemplate).toHaveBeenCalledWith('current-user', 'agent');
  });

  it('should export configuration', () => {
    customizationService.exportConfiguration.and.returnValue(of({ test: 'config' }));
    component.exportConfig();
    expect(customizationService.exportConfiguration).toHaveBeenCalled();
  });

  it('should add widget to grid', () => {
    const widgetType = { id: 'kpi-conversion', name: 'KPI', description: 'Test' };
    component.addWidgetToGrid(widgetType);
    expect(customizationService.addWidget).toHaveBeenCalled();
  });
});
