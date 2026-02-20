import {
    Component,
    Input,
    OnChanges,
    OnDestroy,
    AfterViewInit,
    ViewChild,
    ElementRef,
    SimpleChanges
} from '@angular/core';
import { Chart, ChartConfiguration, ChartDataset, registerables } from 'chart.js';

Chart.register(...registerables);

export interface WaterfallEntry {
    label: string;
    /** Positive = gain, negative = loss, undefined = total/subtotal bar */
    value: number;
    /** If true, renders as an absolute total bar (resets running sum) */
    isTotal?: boolean;
}

/**
 * WaterfallChartComponent — Atlas 2026 Phase 4
 *
 * Renders a cascade/waterfall chart for financial data:
 * - Green bars = positive cash flows (gains, revenues, ROI)
 * - Red bars = negative cash flows (costs, losses)
 * - Neutral bars = absolute totals / subtotals
 *
 * Usage:
 * ```html
 * <app-waterfall-chart
 *   title="ROI Prévisionnel 2026"
 *   currency="MAD"
 *   [entries]="[
 *     { label: 'Capital initial', value: 500000, isTotal: true },
 *     { label: 'Revenus locatifs', value: 120000 },
 *     { label: 'Charges', value: -45000 },
 *     { label: 'Net', value: 0, isTotal: true }
 *   ]">
 * </app-waterfall-chart>
 * ```
 */
@Component({
    selector: 'app-waterfall-chart',
    template: `
    <div class="waterfall-wrapper glass-card">
      <div class="waterfall-header" *ngIf="title">
        <h3 class="waterfall-title">{{ title }}</h3>
        <span class="waterfall-subtitle" *ngIf="subtitle">{{ subtitle }}</span>
      </div>
      <div class="waterfall-canvas-container">
        <canvas #chartCanvas [attr.aria-label]="title || 'Waterfall chart'" role="img"></canvas>
      </div>
      <div class="waterfall-legend">
        <span class="legend-item positive">
          <span class="legend-dot"></span>Gains / Revenus
        </span>
        <span class="legend-item negative">
          <span class="legend-dot"></span>Charges / Pertes
        </span>
        <span class="legend-item total">
          <span class="legend-dot"></span>Total / Solde
        </span>
      </div>
    </div>
  `,
    styles: [`
    .waterfall-wrapper {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .waterfall-header {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .waterfall-title {
      font-family: 'Urbanist', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-neutral-900);
      margin: 0;
      letter-spacing: -0.01em;
    }

    .waterfall-subtitle {
      font-size: 0.8125rem;
      color: var(--color-neutral-500);
      font-weight: 400;
    }

    .waterfall-canvas-container {
      position: relative;
      height: 320px;
      width: 100%;
    }

    .waterfall-canvas-container canvas {
      width: 100% !important;
    }

    .waterfall-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-neutral-200);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-neutral-600);
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .legend-item.positive .legend-dot { background: #27ae60; }
    .legend-item.negative .legend-dot { background: #e74c3c; }
    .legend-item.total .legend-dot    { background: #2c5aa0; }
  `]
})
export class WaterfallChartComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input() entries: WaterfallEntry[] = [];
    @Input() title = '';
    @Input() subtitle = '';
    @Input() currency = 'MAD';

    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

    private chart: Chart | null = null;

    ngAfterViewInit(): void {
        this.buildChart();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['entries'] && !changes['entries'].firstChange) {
            this.buildChart();
        }
    }

    ngOnDestroy(): void {
        this.chart?.destroy();
    }

    private buildChart(): void {
        if (!this.chartCanvas) return;

        this.chart?.destroy();

        const { floats, colors, totals } = this.computeWaterfallData();

        const config: ChartConfiguration = {
            type: 'bar',
            data: {
                labels: this.entries.map(e => e.label),
                datasets: [
                    // Invisible "float" bars to offset each bar to the right start position
                    {
                        label: '_float',
                        data: floats,
                        backgroundColor: 'rgba(0,0,0,0)',
                        borderColor: 'rgba(0,0,0,0)',
                        stack: 'waterfall'
                    } as ChartDataset<'bar'>,
                    // Visible value bars
                    {
                        label: this.currency,
                        data: totals,
                        backgroundColor: colors,
                        borderRadius: 4,
                        borderSkipped: false,
                        stack: 'waterfall'
                    } as ChartDataset<'bar'>
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                if (ctx.datasetIndex === 0) return ''; // hide float tooltip
                                const raw = ctx.raw as number;
                                const formatted = new Intl.NumberFormat('fr-MA', {
                                    style: 'decimal',
                                    maximumFractionDigits: 0
                                }).format(Math.abs(raw));
                                const sign = raw >= 0 ? '+' : '-';
                                return ` ${sign}${formatted} ${this.currency}`;
                            },
                            title: (items) => items[0]?.label ?? ''
                        },
                        backgroundColor: 'rgba(15, 20, 40, 0.9)',
                        titleColor: '#f0f0f0',
                        bodyColor: '#d0d0d0',
                        cornerRadius: 8,
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Urbanist', size: 11, weight: 500 },
                            color: '#9e9e9e',
                            maxRotation: 40
                        },
                        border: { display: false }
                    },
                    y: {
                        stacked: true,
                        grid: {
                            color: 'rgba(0,0,0,0.06)',
                            lineWidth: 1
                        },
                        ticks: {
                            font: { family: 'Urbanist', size: 11 },
                            color: '#9e9e9e',
                            callback: (value) => {
                                const n = value as number;
                                if (Math.abs(n) >= 1_000_000)
                                    return `${(n / 1_000_000).toFixed(1)}M`;
                                if (Math.abs(n) >= 1_000)
                                    return `${(n / 1_000).toFixed(0)}K`;
                                return `${n}`;
                            }
                        },
                        border: { display: false }
                    }
                }
            }
        };

        this.chart = new Chart(this.chartCanvas.nativeElement, config);
    }

    private computeWaterfallData(): {
        floats: number[];
        colors: string[];
        totals: number[];
    } {
        const POSITIVE = '#27ae60';
        const NEGATIVE = '#e74c3c';
        const TOTAL = '#2c5aa0';

        const floats: number[] = [];
        const colors: string[] = [];
        const totals: number[] = [];

        let runningTotal = 0;

        for (const entry of this.entries) {
            if (entry.isTotal) {
                // Absolute total bar — starts from 0
                floats.push(0);
                totals.push(runningTotal);
                colors.push(TOTAL);
                runningTotal = entry.value !== 0 ? entry.value : runningTotal;
            } else {
                const val = entry.value;
                if (val >= 0) {
                    floats.push(runningTotal);
                    totals.push(val);
                    colors.push(POSITIVE);
                } else {
                    floats.push(runningTotal + val);
                    totals.push(-val); // chart.js uses positive height
                    colors.push(NEGATIVE);
                }
                runningTotal += val;
            }
        }

        return { floats, colors, totals };
    }
}
