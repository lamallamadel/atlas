import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ReportingApiService, ObservabilityMetrics } from '../services/reporting-api.service';
import { interval, Subject, EMPTY } from 'rxjs';
import { takeUntil, switchMap, startWith, catchError } from 'rxjs/operators';

interface TimeSeriesPoint {
  timestamp: Date;
  values: { [channel: string]: number };
}

@Component({
  selector: 'app-observability-dashboard',
  templateUrl: './observability-dashboard.component.html',
  styleUrls: ['./observability-dashboard.component.css']
})
export class ObservabilityDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  metrics: ObservabilityMetrics | null = null;
  loading = false;
  error: string | null = null;
  autoRefresh = true;
  refreshInterval = 30000; // 30 seconds
  lastUpdated: Date | null = null;

  dateFrom = '';
  dateTo = '';

  // Historical data for time-series charts (1-minute intervals)
  private queueDepthHistory: TimeSeriesPoint[] = [];
  private readonly maxHistoryPoints = 60; // Keep last 60 data points (1 hour if refresh is 1 min)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ChartClass: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queueTimeSeriesChart: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private latencyHistogramChart: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private failureStackedChart: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private errorCodeChart: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dlqChart: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private quotaChart: any = null;
  private chartsInitialized = false;

  private destroy$ = new Subject<void>();

  constructor(private reportingService: ReportingApiService) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    this.dateTo = this.formatDate(today);
    this.dateFrom = this.formatDate(yesterday);
  }

  ngOnInit(): void {
    this.startAutoRefresh();
  }

  ngAfterViewInit(): void {
    setTimeout(async () => {
      await this.loadChartJs();
      this.chartsInitialized = true;
      if (this.metrics) {
        this.updateAllCharts();
      }
    }, 100);
  }

  private async loadChartJs(): Promise<void> {
    try {
      const module = await import('chart.js/auto');
      // chart.js/auto exports Chart as a named export in ESM — store it so we
      // don't rely on an undeclared global variable.
      this.ChartClass = (module as any).Chart ?? module.default ?? module;
    } catch (error) {
      console.error('Failed to load Chart.js:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyAllCharts();
  }

  private destroyAllCharts(): void {
    if (this.queueTimeSeriesChart) this.queueTimeSeriesChart.destroy();
    if (this.latencyHistogramChart) this.latencyHistogramChart.destroy();
    if (this.failureStackedChart) this.failureStackedChart.destroy();
    if (this.errorCodeChart) this.errorCodeChart.destroy();
    if (this.dlqChart) this.dlqChart.destroy();
    if (this.quotaChart) this.quotaChart.destroy();
  }

  private startAutoRefresh(): void {
    interval(this.refreshInterval)
      .pipe(
        takeUntil(this.destroy$),
        startWith(0),
        switchMap(() => {
          if (!this.autoRefresh) {
            return EMPTY;
          }
          return this.reportingService.getObservabilityMetrics(this.dateFrom, this.dateTo).pipe(
            // Absorb per-tick errors so the interval keeps running on the next tick.
            catchError(err => {
              this.error = 'Erreur de chargement: ' + (err.message || err.status || 'inconnue');
              return EMPTY;
            })
          );
        })
      )
      .subscribe({
        next: (metrics) => {
          if (metrics) {
            this.metrics = metrics;
            this.lastUpdated = new Date();
            this.addToHistory(metrics);
            this.updateAllCharts();
            this.error = null;
          }
        }
      });
  }

  private addToHistory(metrics: ObservabilityMetrics): void {
    const point: TimeSeriesPoint = {
      timestamp: new Date(),
      values: metrics.queueMetrics.queueDepthByChannel
    };
    
    this.queueDepthHistory.push(point);
    
    // Keep only the last maxHistoryPoints
    if (this.queueDepthHistory.length > this.maxHistoryPoints) {
      this.queueDepthHistory.shift();
    }
  }

  loadMetrics(): void {
    this.loading = true;
    this.error = null;

    this.reportingService.getObservabilityMetrics(this.dateFrom, this.dateTo)
      .subscribe({
        next: (metrics) => {
          this.metrics = metrics;
          this.lastUpdated = new Date();
          this.addToHistory(metrics);
          this.updateAllCharts();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load metrics: ' + err.message;
          this.loading = false;
        }
      });
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.loadMetrics();
    }
  }

  onDateChange(): void {
    this.queueDepthHistory = []; // Reset history when date range changes
    this.loadMetrics();
  }

  exportMetrics(format: 'csv' | 'json'): void {
    this.reportingService.exportObservabilityMetrics(format, this.dateFrom, this.dateTo)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `observability-metrics-${new Date().getTime()}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.error = 'Failed to export metrics: ' + err.message;
        }
      });
  }

  private updateAllCharts(): void {
    if (!this.metrics || !this.chartsInitialized || !this.ChartClass) return;

    this.updateQueueTimeSeriesChart();
    this.updateLatencyHistogramChart();
    this.updateFailureStackedChart();
    this.updateErrorCodeChart();
    this.updateDlqChart();
    this.updateQuotaChart();
  }

  private updateQueueTimeSeriesChart(): void {
    if (!this.metrics || this.queueDepthHistory.length === 0) return;

    const ctx = document.getElementById('queueTimeSeriesChart') as HTMLCanvasElement;
    if (!ctx) return;

    const channels = Object.keys(this.metrics.queueMetrics.queueDepthByChannel);
    const labels = this.queueDepthHistory.map(point => 
      point.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );

    const datasets = channels.map((channel, idx) => ({
      label: channel,
      data: this.queueDepthHistory.map(point => point.values[channel] || 0),
      borderColor: this.getChannelColor(idx),
      backgroundColor: this.getChannelColor(idx, 0.1),
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 5
    }));

    const config = {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time (1-min intervals)'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Queue Depth'
            },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              title: (tooltipItems: any) => {
                const index = tooltipItems[0].dataIndex;
                const point = this.queueDepthHistory[index];
                return point.timestamp.toLocaleString('fr-FR');
              }
            }
          }
        }
      }
    };

    if (this.queueTimeSeriesChart) {
      this.queueTimeSeriesChart.destroy();
    }
    this.queueTimeSeriesChart = new this.ChartClass(ctx, config);
  }

  private updateLatencyHistogramChart(): void {
    const data = this.metrics?.latencyMetrics;
    if (!data) return;

    const ctx = document.getElementById('latencyHistogramChart') as HTMLCanvasElement;
    if (!ctx) return;

    const channels = Object.keys(data.latencyByChannel);
    
    const config = {
      type: 'bar',
      data: {
        labels: channels,
        datasets: [
          {
            label: 'P50 (ms)',
            data: channels.map(ch => data.latencyByChannel[ch].p50),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'P95 (ms)',
            data: channels.map(ch => data.latencyByChannel[ch].p95),
            backgroundColor: 'rgba(255, 206, 86, 0.7)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
          },
          {
            label: 'P99 (ms)',
            data: channels.map(ch => data.latencyByChannel[ch].p99),
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Channel'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Latency (ms)'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Message Delivery Latency Distribution'
          }
        }
      }
    };

    if (this.latencyHistogramChart) {
      this.latencyHistogramChart.destroy();
    }
    this.latencyHistogramChart = new this.ChartClass(ctx, config);
  }

  private updateFailureStackedChart(): void {
    const data = this.metrics?.failureMetrics;
    if (!data || !data.failureTrend) return;

    const ctx = document.getElementById('failureStackedChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Group error codes
    const errorCodes = Object.keys(data.failuresByErrorCode);
    const labels = data.failureTrend.map(d => d.date);
    
    // Create stacked dataset for each error code
    const datasets = errorCodes.map((errorCode, idx) => ({
      label: errorCode,
      data: data.failureTrend.map(() => {
        // Simulate distribution across time periods
        // In real implementation, this would come from the API
        return Math.round((data.failuresByErrorCode[errorCode] / data.failureTrend.length) * (0.8 + Math.random() * 0.4));
      }),
      backgroundColor: this.getChannelColor(idx, 0.7),
      borderColor: this.getChannelColor(idx, 1),
      borderWidth: 1
    }));

    const config = {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Failure Count'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Failure Rate Trends by Error Code'
          }
        }
      }
    };

    if (this.failureStackedChart) {
      this.failureStackedChart.destroy();
    }
    this.failureStackedChart = new this.ChartClass(ctx, config);
  }

  private updateErrorCodeChart(): void {
    const data = this.metrics?.failureMetrics;
    if (!data) return;

    const ctx = document.getElementById('errorCodeChart') as HTMLCanvasElement;
    if (!ctx) return;

    const errorCodes = Object.keys(data.failuresByErrorCode);
    const values = Object.values(data.failuresByErrorCode);

    const config = {
      type: 'doughnut',
      data: {
        labels: errorCodes,
        datasets: [{
          data: values,
          backgroundColor: errorCodes.map((_, idx) => this.getChannelColor(idx, 0.7)),
          borderColor: errorCodes.map((_, idx) => this.getChannelColor(idx, 1)),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right'
          },
          title: {
            display: true,
            text: 'Error Code Distribution'
          },
          tooltip: {
            callbacks: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed as number;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    if (this.errorCodeChart) {
      this.errorCodeChart.destroy();
    }
    this.errorCodeChart = new this.ChartClass(ctx, config);
  }

  private updateDlqChart(): void {
    const data = this.metrics?.dlqMetrics;
    if (!data) return;

    const ctx = document.getElementById('dlqChart') as HTMLCanvasElement;
    if (!ctx) return;

    const channels = Object.keys(data.dlqSizeByChannel);
    const values = Object.values(data.dlqSizeByChannel);
    
    // Color code based on warning/critical thresholds
    const warningThreshold = data.alertThreshold * 0.75;
    const criticalThreshold = data.alertThreshold;

    const config = {
      type: 'bar',
      data: {
        labels: channels,
        datasets: [{
          label: 'DLQ Size',
          data: values,
          backgroundColor: values.map(v => 
            v >= criticalThreshold ? 'rgba(244, 67, 54, 0.7)' :
            v >= warningThreshold ? 'rgba(255, 152, 0, 0.7)' :
            'rgba(76, 175, 80, 0.7)'
          ),
          borderColor: values.map(v => 
            v >= criticalThreshold ? 'rgba(244, 67, 54, 1)' :
            v >= warningThreshold ? 'rgba(255, 152, 0, 1)' :
            'rgba(76, 175, 80, 1)'
          ),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Message Count'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `DLQ Size by Channel (Warning: ${warningThreshold}, Critical: ${criticalThreshold})`
          },
          annotation: {
            annotations: {
              warningLine: {
                type: 'line',
                yMin: warningThreshold,
                yMax: warningThreshold,
                borderColor: 'rgba(255, 152, 0, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  display: true,
                  content: 'Warning',
                  position: 'end'
                }
              },
              criticalLine: {
                type: 'line',
                yMin: criticalThreshold,
                yMax: criticalThreshold,
                borderColor: 'rgba(244, 67, 54, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  display: true,
                  content: 'Critical',
                  position: 'end'
                }
              }
            }
          }
        }
      }
    };

    if (this.dlqChart) {
      this.dlqChart.destroy();
    }
    this.dlqChart = new this.ChartClass(ctx, config);
  }

  private updateQuotaChart(): void {
    const data = this.metrics?.quotaMetrics;
    if (!data) return;

    const ctx = document.getElementById('quotaChart') as HTMLCanvasElement;
    if (!ctx) return;

    const channels = Object.keys(data.quotaByChannel);
    const usagePercentages = channels.map(ch => data.quotaByChannel[ch].usagePercentage);

    const config = {
      type: 'bar',
      data: {
        labels: channels,
        datasets: [{
          label: 'Quota Usage (%)',
          data: usagePercentages,
          backgroundColor: usagePercentages.map(p => 
            p >= 90 ? 'rgba(244, 67, 54, 0.7)' :
            p >= 75 ? 'rgba(255, 152, 0, 0.7)' :
            'rgba(76, 175, 80, 0.7)'
          ),
          borderColor: usagePercentages.map(p => 
            p >= 90 ? 'rgba(244, 67, 54, 1)' :
            p >= 75 ? 'rgba(255, 152, 0, 1)' :
            'rgba(76, 175, 80, 1)'
          ),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Usage (%)'
            },
            ticks: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              callback: (value: any) => `${value}%`
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Provider Quota Consumption'
          },
          annotation: {
            annotations: {
              warningLine: {
                type: 'line',
                yMin: 75,
                yMax: 75,
                borderColor: 'rgba(255, 152, 0, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  display: true,
                  content: 'Warning (75%)',
                  position: 'start'
                }
              },
              criticalLine: {
                type: 'line',
                yMin: 90,
                yMax: 90,
                borderColor: 'rgba(244, 67, 54, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  display: true,
                  content: 'Critical (90%)',
                  position: 'start'
                }
              }
            }
          }
        }
      }
    };

    if (this.quotaChart) {
      this.quotaChart.destroy();
    }
    this.quotaChart = new this.ChartClass(ctx, config);
  }

  private getChannelColor(index: number, alpha = 1): string {
    const colors = [
      [54, 162, 235],   // Blue
      [75, 192, 192],   // Teal
      [255, 206, 86],   // Yellow
      [153, 102, 255],  // Purple
      [255, 159, 64],   // Orange
      [255, 99, 132],   // Red
      [201, 203, 207],  // Grey
      [54, 235, 162],   // Green
    ];
    const color = colors[index % colors.length];
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Template helper methods
  getChannelNames(): string[] {
    return this.metrics?.queueMetrics 
      ? Object.keys(this.metrics.queueMetrics.queueDepthByChannel)
      : [];
  }

  getQueueDepth(channel: string): number {
    return this.metrics?.queueMetrics?.queueDepthByChannel[channel] || 0;
  }

  getLatency(channel: string): any {
    return this.metrics?.latencyMetrics?.latencyByChannel[channel] || null;
  }

  getFailureCount(channel: string): number {
    return this.metrics?.failureMetrics?.failuresByChannel[channel] || 0;
  }

  getDlqSize(channel: string): number {
    return this.metrics?.dlqMetrics?.dlqSizeByChannel[channel] || 0;
  }

  getDlqStatus(channel: string): 'normal' | 'warning' | 'critical' {
    const size = this.getDlqSize(channel);
    const threshold = this.metrics?.dlqMetrics?.alertThreshold || 1000;
    const warningThreshold = threshold * 0.75;
    
    if (size >= threshold) return 'critical';
    if (size >= warningThreshold) return 'warning';
    return 'normal';
  }

  getQuotaUsage(channel: string): any {
    return this.metrics?.quotaMetrics?.quotaByChannel[channel] || null;
  }

  getQuotaStatusClass(percentage: number): string {
    if (percentage >= 90) return 'quota-critical';
    if (percentage >= 75) return 'quota-warning';
    return 'quota-normal';
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('fr-FR');
  }
}

