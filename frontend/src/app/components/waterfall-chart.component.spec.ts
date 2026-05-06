import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaterfallChartComponent } from './waterfall-chart.component';
import { SimpleChange } from '@angular/core';
import { DS_CHART_FALLBACK_HEX } from '../design-system/chart-ds-colors';

describe('WaterfallChartComponent', () => {
  let component: WaterfallChartComponent;
  let fixture: ComponentFixture<WaterfallChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaterfallChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WaterfallChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute waterfall data correctly based on entries', () => {
    fixture.componentRef.setInput('entries', [
      { label: 'Initial', value: 100, isTotal: true },
      { label: 'Gain', value: 50 },
      { label: 'Loss', value: -30 },
      { label: 'Final', value: 0, isTotal: true },
    ]);

    fixture.detectChanges();

    const data = (
      component as unknown as {
        computeWaterfallData: () => {
          totals: number[];
          floats: number[];
          colors: string[];
        };
      }
    ).computeWaterfallData();

    // Initial isTotal: true -> runs from 0 to 100.
    // Gain -> runs from 100 to 150.
    // Loss -> runs from 150 to 120 (float at 150-30 = 120, height = 30).
    // Final isTotal: true -> runs from 0 to 120.

    expect(data.totals).toEqual([100, 50, 30, 120]);
    expect(data.floats).toEqual([0, 100, 120, 0]);

    const marine = DS_CHART_FALLBACK_HEX['--ds-marine'];
    const success = DS_CHART_FALLBACK_HEX['--ds-success'];
    const error = DS_CHART_FALLBACK_HEX['--ds-error'];
    expect(data.colors).toEqual([marine, success, error, marine]);
  });

  it('should rebuild chart on changes', () => {
    const comp = component as unknown as Record<string, (...args: unknown[]) => void>;
    const buildSpy = vi.spyOn(comp, 'buildChart');

    fixture.componentRef.setInput('entries', [
      { label: 'Initial', value: 100 },
    ]);

    // simulate ngOnChanges not as firstChange
    component.ngOnChanges({
      entries: new SimpleChange(null, component.entries(), false),
    });

    expect(buildSpy).toHaveBeenCalled();
  });
});
