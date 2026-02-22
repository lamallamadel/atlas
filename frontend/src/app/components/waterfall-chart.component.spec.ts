import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaterfallChartComponent, WaterfallEntry } from './waterfall-chart.component';
import { SimpleChange } from '@angular/core';

describe('WaterfallChartComponent', () => {
    let component: WaterfallChartComponent;
    let fixture: ComponentFixture<WaterfallChartComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WaterfallChartComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(WaterfallChartComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should compute waterfall data correctly based on entries', () => {
        component.entries = [
            { label: 'Initial', value: 100, isTotal: true },
            { label: 'Gain', value: 50 },
            { label: 'Loss', value: -30 },
            { label: 'Final', value: 0, isTotal: true }
        ];

        fixture.detectChanges();

        const data = (component as { computeWaterfallData: () => { totals: number[]; floats: number[]; colors: string[] } }).computeWaterfallData();

        // Initial isTotal: true -> runs from 0 to 100.
        // Gain -> runs from 100 to 150.
        // Loss -> runs from 150 to 120 (float at 150-30 = 120, height = 30).
        // Final isTotal: true -> runs from 0 to 120.

        expect(data.totals).toEqual([100, 50, 30, 120]);
        expect(data.floats).toEqual([0, 100, 120, 0]);

        // POSITIVE = '#27ae60', NEGATIVE = '#e74c3c', TOTAL = '#2c5aa0'
        expect(data.colors).toEqual(['#2c5aa0', '#27ae60', '#e74c3c', '#2c5aa0']);
    });

    it('should rebuild chart on changes', () => {
        spyOn<any>(component, 'buildChart').and.callThrough();

        component.entries = [
            { label: 'Initial', value: 100 }
        ];

        // simulate ngOnChanges not as firstChange
        component.ngOnChanges({
            entries: new SimpleChange(null, component.entries, false)
        });

        expect((component as { buildChart: jasmine.Spy }).buildChart).toHaveBeenCalled();
    });
});
