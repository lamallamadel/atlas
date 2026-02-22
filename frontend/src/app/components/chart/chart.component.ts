import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter, HostListener } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

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
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() type: ChartType = 'bar';
  @Input() labels: string[] = [];
  @Input() datasets: ChartDataset[] = [];
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() height = 400;
  @Input() aspectRatio = 2;
  @Input() animation = true;
  @Input() showLegend = true;
  @Input() showGrid = true;
  @Input() showTooltips = true;
  @Input() darkMode = false;
  @Input() stacked = false;
  @Input() customOptions?: ChartOptions;
  @Input() enableExport = true;

  @Output() chartClick = new EventEmitter<any>();
  @Output() chartHover = new EventEmitter<any>();
  @Output() exportComplete = new EventEmitter<{ format: string; blob: Blob }>();

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
    if (!this.canvasRef?.nativeElement) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: this.type,
      data: {
        labels: this.labels,
        datasets: this.prepareDatasets()
      },
      options: this.buildChartOptions()
    };

    this.chart = new Chart(ctx, config);
  }

  private prepareDatasets(): any[] {
    return this.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || this.getColorForIndex(index, 0.2),
      borderColor: dataset.borderColor || this.getColorForIndex(index, 1),
      borderWidth: dataset.borderWidth ?? 2,
      fill: dataset.fill ?? ((this.type as string) === 'area' || this.type === 'radar'),
      tension: dataset.tension ?? 0.4,
      pointRadius: dataset.pointRadius ?? 4,
      pointHoverRadius: dataset.pointHoverRadius ?? 6
    }));
  }

  private buildChartOptions(): any {
    const isDark = this.darkMode;
    const gridColor = isDark ? 'rgba(158, 158, 158, 0.15)' : 'rgba(189, 189, 189, 0.15)';
    const textColor = isDark ? '#E0E0E0' : '#616161';
    const borderColor = isDark ? 'rgba(158, 158, 158, 0.3)' : 'rgba(189, 189, 189, 0.3)';

    const baseOptions: any = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: this.aspectRatio,
      animation: this.animation ? {
        duration: 750,
        easing: 'easeInOutQuart',
        onComplete: () => {
          if (this.type === 'bar') {
            this.animateBarStagger();
          } else if (this.type === 'line') {
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
          display: this.showLegend,
          position: 'top',
          align: 'start',
          labels: {
            color: textColor,
            font: {
              family: "'Roboto', 'Open Sans', sans-serif",
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
          enabled: this.showTooltips,
          backgroundColor: isDark ? 'rgba(66, 66, 66, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark ? '#FFFFFF' : '#212121',
          bodyColor: isDark ? '#E0E0E0' : '#424242',
          borderColor: borderColor,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            family: "'Roboto', 'Open Sans', sans-serif",
            size: 13,
            weight: 600
          },
          bodyFont: {
            family: "'Roboto', 'Open Sans', sans-serif",
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

    if (this.type !== 'pie' && this.type !== 'doughnut' && this.type !== 'polarArea' && this.type !== 'radar') {
      baseOptions.scales = {
        x: {
          display: this.showGrid,
          grid: {
            display: this.showGrid,
            color: gridColor,
            drawBorder: false,
            drawTicks: false
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Roboto', 'Open Sans', sans-serif",
              size: 11,
              weight: 400
            },
            padding: 8
          },
          border: {
            display: false
          },
          stacked: this.stacked
        },
        y: {
          display: this.showGrid,
          grid: {
            display: this.showGrid,
            color: gridColor,
            drawBorder: false,
            drawTicks: false
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Roboto', 'Open Sans', sans-serif",
              size: 11,
              weight: 400
            },
            padding: 8,
            callback: (value: any) => this.formatValue(value)
          },
          border: {
            display: false
          },
          stacked: this.stacked
        }
      };
    }

    return { ...baseOptions, ...this.customOptions };
  }

  private getColorForIndex(index: number, alpha = 1): string {
    const colors = [
      { r: 44, g: 90, b: 160 },    // primary
      { r: 66, g: 136, b: 206 },   // secondary
      { r: 117, g: 199, b: 127 },  // success
      { r: 240, g: 201, b: 115 },  // warning
      { r: 237, g: 127, b: 127 },  // error
      { r: 125, g: 184, b: 238 },  // info
      { r: 158, g: 158, b: 158 },  // neutral
      { r: 171, g: 130, b: 255 }   // accent
    ];

    const color = colors[index % colors.length];
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
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
    if (!this.animation || !this.chart) return;

    const meta = this.chart.getDatasetMeta(0);
    if (!meta || !meta.data) return;

    meta.data.forEach((_bar: unknown, index: number) => {
      setTimeout(() => {
        if (this.chart) this.chart.update('none');
      }, index * 50);
    });
  }

  private animateLineProgressive(): void {
    if (!this.animation || !this.chart) return;

  }

  private updateChart(): void {
    if (!this.chart) return;

    this.chart.data.labels = this.labels;
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
    if (!this.canvasRef?.nativeElement) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.chart) {
        this.chart.resize();
      }
    });

    this.resizeObserver.observe(this.canvasRef.nativeElement.parentElement!);
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
    if (!this.canvasRef?.nativeElement) return;

    const canvas = this.canvasRef.nativeElement;
    const svg = this.canvasToSVG(canvas);
    const blob = new Blob([svg], { type: 'image/svg+xml' });

    this.downloadBlob(blob, `${filename}.svg`);
    this.exportComplete.emit({ format: 'svg', blob });
  }

  private async exportAsPNG(filename: string, quality: number): Promise<void> {
    if (!this.canvasRef?.nativeElement) return;

    const canvas = this.canvasRef.nativeElement;
    canvas.toBlob((blob) => {
      if (blob) {
        this.downloadBlob(blob, `${filename}.png`);
        this.exportComplete.emit({ format: 'png', blob });
      }
    }, 'image/png', quality);
  }

  private canvasToSVG(canvas: HTMLCanvasElement): string {
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);

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
