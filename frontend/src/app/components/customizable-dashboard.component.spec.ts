import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomizableDashboardComponent } from './customizable-dashboard.component';
import { DashboardCustomizationService } from '../services/dashboard-customization.service';
import { of } from 'rxjs';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('CustomizableDashboardComponent', () => {
  let component: CustomizableDashboardComponent;
  let fixture: ComponentFixture<CustomizableDashboardComponent>;
  let customizationService: AngularVitestPartialMock<DashboardCustomizationService>;

  beforeEach(async () => {
    const serviceSpy = {
      getUserPreferences: vi
        .fn()
        .mockName('DashboardCustomizationService.getUserPreferences'),
      updateDashboardLayout: vi
        .fn()
        .mockName('DashboardCustomizationService.updateDashboardLayout'),
      applyRoleTemplate: vi
        .fn()
        .mockName('DashboardCustomizationService.applyRoleTemplate'),
      exportConfiguration: vi
        .fn()
        .mockName('DashboardCustomizationService.exportConfiguration'),
      importConfiguration: vi
        .fn()
        .mockName('DashboardCustomizationService.importConfiguration'),
      addWidget: vi.fn().mockName('DashboardCustomizationService.addWidget'),
      removeWidget: vi
        .fn()
        .mockName('DashboardCustomizationService.removeWidget'),
      updateWidget: vi
        .fn()
        .mockName('DashboardCustomizationService.updateWidget'),
      setEditMode: vi
        .fn()
        .mockName('DashboardCustomizationService.setEditMode'),
      getAvailableTemplates: vi
        .fn()
        .mockName('DashboardCustomizationService.getAvailableTemplates'),
      layout$: of({ widgets: [] }),
      editMode$: of(false),
    };

    serviceSpy.getAvailableTemplates.mockReturnValue([
      {
        id: 'agent',
        name: 'Agent Dashboard',
        description: 'For agents',
        role: 'agent',
        layout: { widgets: [] },
      },
    ]);

    await TestBed.configureTestingModule({
      imports: [CustomizableDashboardComponent],
      providers: [
        { provide: DashboardCustomizationService, useValue: serviceSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    customizationService = TestBed.inject(
      DashboardCustomizationService
    ) as AngularVitestPartialMock<DashboardCustomizationService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomizableDashboardComponent);
    component = fixture.componentInstance;
    customizationService.getUserPreferences.mockReturnValue(
      of({
        userId: 'test-user',
        dashboardLayout: { widgets: [] },
      })
    );
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
    customizationService.applyRoleTemplate.mockReturnValue(
      of({
        userId: 'test-user',
        roleTemplate: 'agent',
      })
    );

    component.applyTemplate('agent');
    expect(customizationService.applyRoleTemplate).toHaveBeenCalledWith(
      'current-user',
      'agent'
    );
  });

  it('should export configuration', () => {
    customizationService.exportConfiguration.mockReturnValue(
      of({ test: 'config' })
    );
    component.exportConfig();
    expect(customizationService.exportConfiguration).toHaveBeenCalled();
  });

  it('should add widget to grid', () => {
    const widgetType = {
      id: 'kpi-conversion',
      name: 'KPI',
      description: 'Test',
    };
    component.addWidgetToGrid(widgetType);
    expect(customizationService.addWidget).toHaveBeenCalled();
  });
});
