import { Component, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, HostListener, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { dsChartSeriesRgba, dsRgba, resolveDsToken } from '../../design-system/chart-ds-colors';

Chart.register(...registerables);

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  plugins?: any;
  scales?: any;
  animation?: any;
  interaction?: any;
}

export interface ChartExportOptions {
  filename?: string;
  format?: 'svg' | 'png';
  quality?: number;
}

@Component({
    selector: 'app-chart',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
    templateUrl: './chart.component.html',
    styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  readonly type = input<ChartType>('bar');
  readonly labels = input<string[]>([]);
  readonly datasets = input<ChartDataset[]>([]);
  readonly title = input<string>();
  readonly subtitle = input<string>();
  readonly height = input(400);
  readonly aspectRatio = input(2);
  readonly animation = input(true);
  readonly showLegend = input(true);
  readonly showGrid = input(true);
  readonly showTooltips = input(true);
  readonly darkMode = input(false);
  readonly stacked = input(false);
  readonly customOptions = input<ChartOptions>();
  readonly enableExport = input(true);

  readonly chartClick = output<any>();
  readonly chartHover = output<any>();
  readonly exportComplete = output<{
    format: string;
    blob: Blob;
}>();

  private chart?: Chart;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.initializeChart();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['datasets'] || changes['labels'] || changes['darkMode'])) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private initializeChart(): void {
    const canvasRef = this.canvasRef();
    if (!canvasRef?.nativeElement) return;

    const ctx = canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: this.type(),
      data: {
        labels: this.labels(),
        datasets: this.prepareDatasets()
      },
      options: this.buildChartOptions()
    };

    this.chart = new Chart(ctx, config);
  }

  private prepareDatasets(): any[] {
    return this.datasets().map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || this.getColorForIndex(index, 0.2),
      borderColor: dataset.borderColor || this.getColorForIndex(index, 1),
      borderWidth: dataset.borderWidth ?? 2,
      fill: dataset.fill ?? ((this.type() as string) === 'area' || this.type() === 'radar'),
      tension: dataset.tension ?? 0.4,
      pointRadius: dataset.pointRadius ?? 4,
      pointHoverRadius: dataset.pointHoverRadius ?? 6
    }));
  }

  private buildChartOptions(): any {
    const isDark = this.darkMode();
    const gridColor = isDark ? dsRgba('--ds-text-faint', 0.2) : dsRgba('--ds-text', 0.07);
    const textColor = resolveDsToken('--ds-text-muted');
    const borderColor = dsRgba('--ds-border', isDark ? 0.55 : 0.65);

    const baseOptions: any = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: this.aspectRatio(),
      animation: this.animation() ? {
        duration: 750,
        easing: 'easeInOutQuart',
        onComplete: () => {
          const type = this.type();
          if (type === 'bar') {
            this.animateBarStagger();
          } else if (type === 'line') {
            this.animateLineProgressive();
          }
        }
      } : false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: this.showLegend(),
          position: 'top',
          align: 'start',
          labels: {
            color: textColor,
            font: {
              family: "'Plus Jakarta Sans', system-ui, sans-serif",
              size: 12,
              weight: 500
            },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          enabled: this.showTooltips(),
          backgroundColor: dsRgba('--ds-surface', 0.97),
          titleColor: resolveDsToken('--ds-text'),
          bodyColor: resolveDsToken('--ds-text-muted'),
          borderColor,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            family: "'Plus Jakarta Sans', system-ui, sans-serif",
            size: 13,
            weight: 600
          },
          bodyFont: {
            family: "'Plus Jakarta Sans', system-ui, sans-serif",
            size: 12,
            weight: 400
          },
          displayColors: true,
          boxWidth: 12,
          boxHeight: 12,
          boxPadding: 6,
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += this.formatValue(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      onClick: (event: any, elements: any[]) => {
        if (elements.length > 0) {
          this.chartClick.emit({ event, elements });
        }
      },
      onHover: (event: any, elements: any[]) => {
        this.chartHover.emit({ event, elements });
      }
    };

    const type = this.type();
    if (type !== 'pie' && type !== 'doughnut' && type !== 'polarArea' && type !== 'radar') {
      baseOptions.scales = {
        x: {
          display: this.showGrid(),
          grid: {
            display: this.showGrid(),
            color: gridColor,
            drawBorder: false,
            drawTicks: false
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Plus Jakarta Sans', system-ui, sans-serif",
              size: 11,
              weight: 400
            },
            padding: 8
          },
          border: {
            display: false
          },
          stacked: this.stacked()
        },
        y: {
          display: this.showGrid(),
          grid: {
            display: this.showGrid(),
            color: gridColor,
            drawBorder: false,
            drawTicks: false
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Plus Jakarta Sans', system-ui, sans-serif",
              size: 11,
              weight: 400
            },
            padding: 8,
            callback: (value: any) => this.formatValue(value)
          },
          border: {
            display: false
          },
          stacked: this.stacked()
        }
      };
    }

    return { ...baseOptions, ...this.customOptions() };
  }

  private getColorForIndex(index: number, alpha = 1): string {
    return dsChartSeriesRgba(index, alpha);
  }

  private formatValue(value: any): string {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
      } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
      }
      return value.toLocaleString();
    }
    return String(value);
  }

  private animateBarStagger(): void {
    if (!this.animation() || !this.chart) return;

    const meta = this.chart.getDatasetMeta(0);
    if (!meta || !meta.data) return;

    meta.data.forEach((_bar: unknown, index: number) => {
      setTimeout(() => {
        if (this.chart) this.chart.update('none');
      }, index * 50);
    });
  }

  private animateLineProgressive(): void {
    if (!this.animation() || !this.chart) return;

  }

  private updateChart(): void {
    if (!this.chart) return;

    this.chart.data.labels = this.labels();
    this.chart.data.datasets = this.prepareDatasets();
    this.chart.options = this.buildChartOptions();
    this.chart.update('none');
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  private setupResizeObserver(): void {
    const canvasRef = this.canvasRef();
    if (!canvasRef?.nativeElement) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.chart) {
        this.chart.resize();
      }
    });

    this.resizeObserver.observe(canvasRef.nativeElement.parentElement!);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.chart) {
      this.chart.resize();
    }
  }

  async exportChart(options: ChartExportOptions = {}): Promise<void> {
    if (!this.chart) return;

    const format = options.format || 'png';
    const filename = options.filename || `chart-${Date.now()}`;
    const quality = options.quality || 1.0;

    if (format === 'svg') {
      await this.exportAsSVG(filename);
    } else {
      await this.exportAsPNG(filename, quality);
    }
  }

  private async exportAsSVG(filename: string): Promise<void> {
    const canvasRef = this.canvasRef();
    if (!canvasRef?.nativeElement) return;

    const canvas = canvasRef.nativeElement;
    const svg = this.canvasToSVG(canvas);
    const blob = new Blob([svg], { type: 'image/svg+xml' });

    this.downloadBlob(blob, `${filename}.svg`);
    this.exportComplete.emit({ format: 'svg', blob });
  }

  private async exportAsPNG(filename: string, quality: number): Promise<void> {
    const canvasRef = this.canvasRef();
    if (!canvasRef?.nativeElement) return;

    const canvas = canvasRef.nativeElement;
    canvas.toBlob((blob) => {
      if (blob) {
        this.downloadBlob(blob, `${filename}.png`);
        this.exportComplete.emit({ format: 'png', blob });
      }
    }, 'image/png', quality);
  }

  private canvasToSVG(canvas: HTMLCanvasElement): string {
    const width = canvas.width;
    const height = canvas.height;

    const dataUrl = canvas.toDataURL('image/png');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  refreshChart(): void {
    this.updateChart();
  }

  getChartInstance(): Chart | undefined {
    return this.chart;
  }
}
