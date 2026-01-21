import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ReportingApiService, ObservabilityMetrics } from '../services/reporting-api.service';
import { interval, Subject } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Chart: any;

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
  refreshInterval = 30000;
  lastUpdated: Date | null = null;

  dateFrom = '';
  dateTo = '';

  queueChartData: any;
  latencyChartData: any;
  failureChartData: any;
  failureTrendChartData: any;
  errorCodeChartData: any;
  dlqChartData: any;
  quotaChartData: any;

  private queueChart: any;
  private latencyChart: any;
  private failureChart: any;
  private failureTrendChart: any;
  private errorCodeChart: any;
  private dlqChart: any;
  private quotaChart: any;
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
    this.loadMetrics();
    this.startAutoRefresh();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadChartJsAndInitCharts();
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private async loadChartJsAndInitCharts(): Promise<void> {
    try {
      await import('chart.js/auto');
      this.chartsInitialized = true;
      if (this.metrics) {
        this.updateCharts();
      }
    } catch (error) {
      console.error('Failed to load Chart.js:', error);
    }
  }

  private destroyCharts(): void {
    if (this.queueChart) this.queueChart.destroy();
    if (this.latencyChart) this.latencyChart.destroy();
    if (this.failureChart) this.failureChart.destroy();
    if (this.failureTrendChart) this.failureTrendChart.destroy();
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
          if (this.autoRefresh) {
            return this.reportingService.getObservabilityMetrics(this.dateFrom, this.dateTo);
          }
          return [];
        })
      )
      .subscribe({
        next: (metrics) => {
          if (metrics) {
            this.metrics = metrics;
            this.lastUpdated = new Date();
            this.updateCharts();
            this.error = null;
          }
        },
        error: (err) => {
          this.error = 'Failed to load metrics: ' + err.message;
        }
      });
  }

  loadMetrics(): void {
    this.loading = true;
    this.error = null;

    this.reportingService.getObservabilityMetrics(this.dateFrom, this.dateTo)
      .subscribe({
        next: (metrics) => {
          this.metrics = metrics;
          this.lastUpdated = new Date();
          this.updateCharts();
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
  }

  onDateChange(): void {
    this.loadMetrics();
  }

  exportMetrics(format: 'csv' | 'json'): void {
    this.reportingService.exportObservabilityMetrics(format, this.dateFrom, this.dateTo)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `observability-metrics.${format}`;
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

  private updateCharts(): void {
    if (!this.metrics || !this.chartsInitialized) return;

    this.updateQueueChart();
    this.updateLatencyChart();
    this.updateFailureChart();
    this.updateFailureTrendChart();
    this.updateErrorCodeChart();
    this.updateDlqChart();
    this.updateQuotaChart();
  }

  private updateQueueChart(): void {
    const data = this.metrics?.queueMetrics;
    if (!data || !this.chartsInitialized) return;

    const channels = Object.keys(data.queueDepthByChannel);
    const values = Object.values(data.queueDepthByChannel);

    this.queueChartData = {
      labels: channels,
      datasets: [{
        label: 'Queue Depth',
        data: values,
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ]
      }]
    };

    const ctx = document.getElementById('queueChart') as HTMLCanvasElement;
    if (ctx) {
      if (this.queueChart) this.queueChart.destroy();
      this.queueChart = new Chart(ctx, {
        type: 'bar',
        data: this.queueChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }

  private updateLatencyChart(): void {
    const data = this.metrics?.latencyMetrics;
    if (!data || !this.chartsInitialized) return;

    const channels = Object.keys(data.latencyByChannel);
    const p50Data = channels.map(ch => data.latencyByChannel[ch].p50);
    const p95Data = channels.map(ch => data.latencyByChannel[ch].p95);
    const p99Data = channels.map(ch => data.latencyByChannel[ch].p99);

    this.latencyChartData = {
      labels: channels,
      datasets: [
        {
          label: 'P50 (ms)',
          data: p50Data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'P95 (ms)',
          data: p95Data,
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        },
        {
          label: 'P99 (ms)',
          data: p99Data,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };

    const ctx = document.getElementById('latencyChart') as HTMLCanvasElement;
    if (ctx) {
      if (this.latencyChart) this.latencyChart.destroy();
      this.latencyChart = new Chart(ctx, {
        type: 'bar',
        data: this.latencyChartData,
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      });
    }
  }

  private updateFailureChart(): void {
    const data = this.metrics?.failureMetrics;
    if (!data || !this.chartsInitialized) return;

    const channels = Object.keys(data.failuresByChannel);
    const values = Object.values(data.failuresByChannel);

    this.failureChartData = {
      labels: channels,
      datasets: [{
        label: 'Failures',
        data: values,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    };

    const ctx = document.getElementById('failureChart') as HTMLCanvasElement;
    if (ctx) {
      if (this.failureChart) this.failureChart.destroy();
      this.failureChart = new Chart(ctx, {
        type: 'bar',
        data: this.failureChartData,
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      });
    }
  }

  private updateFailureTrendChart(): void {
    const data = this.metrics?.failureMetrics;
    if (!data || !data.failureTrend || !this.chartsInitialized) return;

    const labels = data.failureTrend.map(d => d.date);
    const values = data.failureTrend.map(d => d.value);

    this.failureTrendChartData = {
      labels: labels,
      datasets: [{
        label: 'Failure Trend',
        data: values,
        fill: false,
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
      }]
    };

    const ctx = document.getElementById('failureTrendChart') as HTMLCanvasElement;
    if (ctx) {
      if (this.failureTrendChart) this.failureTrendChart.destroy();
      this.failureTrendChart = new Chart(ctx, {
        type: 'line',
        data: this.failureTrendChartData,
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      });
    }
  }

  private updateErrorCodeChart(): void {
    const data = this.metrics?.failureMetrics;
    if (!data || !this.chartsInitialized) return;

    const errorCodes = Object.keys(data.failuresByErrorCode);
    const values = Object.values(data.failuresByErrorCode);

    this.errorCodeChartData = {
      labels: errorCodes,
      datasets: [{
        label: 'Error Code Frequency',
        data: values,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ]
      }]
    };

    const ctx = document.getElementById('errorCodeChart') as HTMLCanvasElement;
    if (ctx) {
      if (this.errorCodeChart) this.errorCodeChart.destroy();
      this.errorCodeChart = new Chart(ctx, {
        type: 'pie',
        data: this.errorCodeChartData,
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }

  private updateDlqChart(): void {
    const data = this.metrics?.dlqMetrics;
    if (!data || !this.chartsInitialized) return;

    const channels = Object.keys(data.dlqSizeByChannel);
    const values = Object.values(data.dlqSizeByChannel);

    this.dlqChartData = {
      labels: channels,
      datasets: [{
        label: 'DLQ Size',
        data: values,
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1
      }]
    };

    const ctx = document.getElementById('dlqChart') as HTMLCanvasElement;
    if (ctx) {
      if (this.dlqChart) this.dlqChart.destroy();
      this.dlqChart = new Chart(ctx, {
        type: 'bar',
        data: this.dlqChartData,
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      });
    }
  }

  private updateQuotaChart(): void {
    const data = this.metrics?.quotaMetrics;
    if (!data || !this.chartsInitialized) return;

    const channels = Object.keys(data.quotaByChannel);
    const usagePercentages = channels.map(ch => data.quotaByChannel[ch].usagePercentage);

    this.quotaChartData = {
      labels: channels,
      datasets: [{
        label: 'Quota Usage (%)',
        data: usagePercentages,
        backgroundColor: usagePercentages.map(p => 
          p > 90 ? 'rgba(255, 99, 132, 0.6)' :
          p > 75 ? 'rgba(255, 206, 86, 0.6)' :
          'rgba(75, 192, 192, 0.6)'
        ),
        borderWidth: 1
      }]
    };

    const ctx = document.getElementById('quotaChart') as HTMLCanvasElement;
    if (ctx) {
      if (this.quotaChart) this.quotaChart.destroy();
      this.quotaChart = new Chart(ctx, {
        type: 'bar',
        data: this.quotaChartData,
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
      });
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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

  getQuotaUsage(channel: string): any {
    return this.metrics?.quotaMetrics?.quotaByChannel[channel] || null;
  }

  getQuotaStatusClass(percentage: number): string {
    if (percentage > 90) return 'quota-critical';
    if (percentage > 75) return 'quota-warning';
    return 'quota-normal';
  }
}
