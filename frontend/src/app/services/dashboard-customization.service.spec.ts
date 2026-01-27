import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardCustomizationService, DashboardLayout, UserPreferences, WidgetConfig } from './dashboard-customization.service';

describe('DashboardCustomizationService', () => {
  let service: DashboardCustomizationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardCustomizationService]
    });
    service = TestBed.inject(DashboardCustomizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch user preferences', () => {
    const mockPreferences: UserPreferences = {
      userId: 'user-123',
      dashboardLayout: { widgets: [] },
      theme: 'dark'
    };

    service.getUserPreferences('user-123').subscribe(prefs => {
      expect(prefs).toEqual(mockPreferences);
    });

    const req = httpMock.expectOne('/api/v1/user-preferences/user-123');
    expect(req.request.method).toBe('GET');
    req.flush(mockPreferences);
  });

  it('should update dashboard layout', () => {
    const layout: DashboardLayout = {
      widgets: [{ id: '1', type: 'kpi', x: 0, y: 0, cols: 4, rows: 3 }]
    };

    service.updateDashboardLayout('user-123', layout).subscribe();

    const req = httpMock.expectOne('/api/v1/user-preferences/user-123/dashboard-layout');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(layout);
    req.flush({ userId: 'user-123', dashboardLayout: layout });
  });

  it('should apply role template', () => {
    service.applyRoleTemplate('user-123', 'agent').subscribe();

    const req = httpMock.expectOne('/api/v1/user-preferences/user-123/apply-template?template=agent');
    expect(req.request.method).toBe('POST');
    req.flush({ userId: 'user-123', roleTemplate: 'agent' });
  });

  it('should add widget to layout', () => {
    const widget: WidgetConfig = { id: '', type: 'kpi', x: 0, y: 0, cols: 4, rows: 3 };
    
    service.addWidget(widget);

    service.layout$.subscribe(layout => {
      expect(layout.widgets.length).toBe(1);
      expect(layout.widgets[0].type).toBe('kpi');
      expect(layout.widgets[0].id).toBeTruthy();
    });
  });

  it('should remove widget from layout', () => {
    const widget: WidgetConfig = { id: 'widget-1', type: 'kpi', x: 0, y: 0, cols: 4, rows: 3 };
    service.addWidget(widget);
    service.removeWidget('widget-1');

    service.layout$.subscribe(layout => {
      expect(layout.widgets.length).toBe(0);
    });
  });

  it('should provide available templates', () => {
    const templates = service.getAvailableTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.find(t => t.id === 'agent')).toBeTruthy();
    expect(templates.find(t => t.id === 'manager')).toBeTruthy();
  });

  it('should toggle edit mode', (done) => {
    service.setEditMode(true);
    
    service.editMode$.subscribe(editMode => {
      expect(editMode).toBe(true);
      done();
    });
  });
});
