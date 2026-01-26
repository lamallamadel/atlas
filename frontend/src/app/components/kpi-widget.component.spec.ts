import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { KpiWidgetComponent } from './kpi-widget.component';
import { DashboardKpiService } from '../services/dashboard-kpi.service';
import { of, throwError } from 'rxjs';

describe('KpiWidgetComponent', () => {
  let component: KpiWidgetComponent;
  let fixture: ComponentFixture<KpiWidgetComponent>;
  let kpiService: jasmine.SpyObj<DashboardKpiService>;

  beforeEach(async () => {
    const kpiServiceSpy = jasmine.createSpyObj('DashboardKpiService', ['getKPI']);

    await TestBed.configureTestingModule({
      imports: [KpiWidgetComponent, HttpClientTestingModule],
      providers: [
        { provide: DashboardKpiService, useValue: kpiServiceSpy }
      ]
    }).compileComponents();

    kpiService = TestBed.inject(DashboardKpiService) as jasmine.SpyObj<DashboardKpiService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KpiWidgetComponent);
    component = fixture.componentInstance;
    component.config = {
      id: 'test-1',
      type: 'kpi-conversion',
      title: 'Test KPI',
      x: 0,
      y: 0,
      cols: 4,
      rows: 3
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load KPI data on init', () => {
    const mockKpiData = {
      value: 85,
      label: 'Conversion Rate',
      changePercent: 5.2
    };

    kpiService.getKPI.and.returnValue(of(mockKpiData));
    fixture.detectChanges();

    expect(component.kpiData.value).toBe(85);
    expect(component.kpiData.change).toBe(5.2);
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading fails', () => {
    kpiService.getKPI.and.returnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    expect(component.error).toBeTruthy();
    expect(component.loading).toBe(false);
  });

  it('should emit remove event', () => {
    spyOn(component.remove, 'emit');
    component.onRemove();
    expect(component.remove.emit).toHaveBeenCalledWith('test-1');
  });

  it('should refresh data on refresh', () => {
    const mockKpiData = { value: 90, label: 'KPI', changePercent: 3 };
    kpiService.getKPI.and.returnValue(of(mockKpiData));
    
    component.onRefresh();
    
    expect(kpiService.getKPI).toHaveBeenCalled();
  });
});
