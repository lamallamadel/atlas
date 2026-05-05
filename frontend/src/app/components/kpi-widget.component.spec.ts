import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { KpiWidgetComponent } from './kpi-widget.component';
import { DashboardKpiService } from '../services/dashboard-kpi.service';
import { of, throwError } from 'rxjs';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('KpiWidgetComponent', () => {
  let component: KpiWidgetComponent;
  let fixture: ComponentFixture<KpiWidgetComponent>;
  let kpiService: AngularVitestPartialMock<DashboardKpiService>;

  beforeEach(async () => {
    const kpiServiceSpy = {
      getKPI: vi.fn().mockName('DashboardKpiService.getKPI'),
    };

    await TestBed.configureTestingModule({
      imports: [KpiWidgetComponent],
      providers: [
        { provide: DashboardKpiService, useValue: kpiServiceSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    kpiService = TestBed.inject(
      DashboardKpiService
    ) as AngularVitestPartialMock<DashboardKpiService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KpiWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', {
      id: 'test-1',
      type: 'kpi-conversion',
      title: 'Test KPI',
      x: 0,
      y: 0,
      cols: 4,
      rows: 3,
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load KPI data on init', () => {
    const mockKpiData = {
      value: 85,
      label: 'Conversion Rate',
      changePercent: 5.2,
    };

    kpiService.getKPI.mockReturnValue(of(mockKpiData));
    fixture.detectChanges();

    expect(component.kpiData.value).toBe(85);
    expect(component.kpiData.change).toBe(5.2);
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading fails', () => {
    kpiService.getKPI.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    expect(component.error).toBeTruthy();
    expect(component.loading).toBe(false);
  });

  it('should emit remove event', () => {
    vi.spyOn(component.remove, 'emit');
    component.onRemove();
    expect(component.remove.emit).toHaveBeenCalledWith('test-1');
  });

  it('should refresh data on refresh', () => {
    const mockKpiData = { value: 90, label: 'KPI', changePercent: 3 };
    kpiService.getKPI.mockReturnValue(of(mockKpiData));

    component.onRefresh();

    expect(kpiService.getKPI).toHaveBeenCalled();
  });
});
