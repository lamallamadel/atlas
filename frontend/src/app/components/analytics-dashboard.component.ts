import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnalyticsApiService, AnalyticsResponse, MetabaseEmbedResponse } from '../services/analytics-api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-dashboard',
  template: `
    <div class="analytics-dashboard">
      <mat-tab-group [(selectedIndex)]="activeTabIndex">
        <mat-tab label="Overview">
          <div class="tab-content">
            <div class="date-range-picker">
              <mat-form-field>
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" [(ngModel)]="dateRange.start" (dateChange)="onDateRangeChange()">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>
              <mat-form-field>
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" [(ngModel)]="dateRange.end" (dateChange)="onDateRangeChange()">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="charts-grid">
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Cohort Analysis</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <canvas id="cohortChart"></canvas>
                </mat-card-content>
              </mat-card>

              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Sales Funnel</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <canvas id="funnelChart"></canvas>
                </mat-card-content>
              </mat-card>

              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Agent Performance</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <canvas id="agentChart"></canvas>
                </mat-card-content>
              </mat-card>

              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Market Trends</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <canvas id="marketChart"></canvas>
                </mat-card-content>
              </mat-card>

              <mat-card class="chart-card full-width">
                <mat-card-header>
                  <mat-card-title>Revenue Forecast</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <canvas id="revenueChart"></canvas>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Metabase Dashboard">
          <div class="tab-content">
            <iframe *ngIf="metabaseDashboardUrl" 
                    [src]="metabaseDashboardUrl" 
                    frameborder="0"
                    class="metabase-iframe"></iframe>
          </div>
        </mat-tab>

        <mat-tab label="Drill-Down" *ngIf="metabaseQuestionUrl">
          <div class="tab-content">
            <iframe [src]="metabaseQuestionUrl" 
                    frameborder="0"
                    class="metabase-iframe"></iframe>
          </div>
        </mat-tab>
      </mat-tab-group>

      <div *ngIf="loading" class="loading-overlay">
        <mat-spinner></mat-spinner>
      </div>
    </div>
  `,
  styles: [`
    .analytics-dashboard {
      padding: 20px;
      position: relative;
    }

    .date-range-picker {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
    }

    .chart-card {
      height: 400px;
    }

    .chart-card.full-width {
      grid-column: 1 / -1;
    }

    .chart-card mat-card-content {
      height: calc(100% - 80px);
      position: relative;
    }

    .chart-card canvas {
      max-height: 100%;
    }

    .metabase-iframe {
      width: 100%;
      height: 800px;
      border: none;
    }

    .tab-content {
      padding: 20px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  activeTabIndex = 0;

  metabaseDashboardUrl: SafeResourceUrl | null = null;
  metabaseQuestionUrl: SafeResourceUrl | null = null;

  cohortData: AnalyticsResponse | null = null;
  funnelData: AnalyticsResponse | null = null;
  agentPerformanceData: AnalyticsResponse | null = null;
  marketTrendsData: AnalyticsResponse | null = null;
  revenueForecastData: AnalyticsResponse | null = null;

  cohortChart: Chart | null = null;
  funnelChart: Chart | null = null;
  agentChart: Chart | null = null;
  marketChart: Chart | null = null;
  revenueChart: Chart | null = null;

  loading = false;
  dateRange = {
    start: this.getDefaultStartDate(),
    end: this.getDefaultEndDate()
  };

  constructor(
    private analyticsService: AnalyticsApiService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadMetabaseDashboard();
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadMetabaseDashboard(): void {
    this.analyticsService.generateMetabaseEmbedUrl({
      dashboardId: '1',
      params: { org_id: 'default' },
      expirationMinutes: 60
    }).subscribe({
      next: (response: MetabaseEmbedResponse) => {
        this.metabaseDashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.embedUrl);
      },
      error: (error) => console.error('Error loading Metabase dashboard', error)
    });
  }

  loadAnalytics(): void {
    this.loading = true;
    const startDate = this.formatDate(this.dateRange.start);
    const endDate = this.formatDate(this.dateRange.end);

    this.analyticsService.getCohortAnalysis(startDate, endDate).subscribe({
      next: (data) => {
        this.cohortData = data;
        setTimeout(() => this.renderCohortChart(), 100);
      }
    });

    this.analyticsService.getFunnelVisualization(startDate, endDate).subscribe({
      next: (data) => {
        this.funnelData = data;
        setTimeout(() => this.renderFunnelChart(), 100);
      }
    });

    this.analyticsService.getAgentPerformanceLeaderboard(startDate, endDate).subscribe({
      next: (data) => {
        this.agentPerformanceData = data;
        setTimeout(() => this.renderAgentChart(), 100);
      }
    });

    this.analyticsService.getPropertyMarketTrends(startDate, endDate).subscribe({
      next: (data) => {
        this.marketTrendsData = data;
        setTimeout(() => this.renderMarketChart(), 100);
      }
    });

    this.analyticsService.getRevenueForecast(6).subscribe({
      next: (data) => {
        this.revenueForecastData = data;
        setTimeout(() => this.renderRevenueChart(), 100);
        this.loading = false;
      }
    });
  }

  renderCohortChart(): void {
    if (!this.cohortData) return;
    const canvas = document.getElementById('cohortChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.cohortChart) {
      this.cohortChart.destroy();
    }

    this.cohortChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.cohortData.data.map(d => d.date),
        datasets: [{
          label: 'Conversion Rate (%)',
          data: this.cohortData.data.map(d => d.value),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            this.drillDownToCohort(elements[0].index);
          }
        }
      }
    });
  }

  renderFunnelChart(): void {
    if (!this.funnelData) return;
    const canvas = document.getElementById('funnelChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.funnelChart) {
      this.funnelChart.destroy();
    }

    const colors = ['#1976d2', '#2196f3', '#64b5f6', '#90caf9', '#bbdefb', '#e3f2fd'];

    this.funnelChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.funnelData.data.map(d => d.date),
        datasets: [{
          label: 'Count',
          data: this.funnelData.data.map(d => d.value as number),
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y'
      }
    });
  }

  renderAgentChart(): void {
    if (!this.agentPerformanceData) return;
    const canvas = document.getElementById('agentChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.agentChart) {
      this.agentChart.destroy();
    }

    this.agentChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.agentPerformanceData.data.map(d => d.date),
        datasets: [{
          label: 'Performance Score',
          data: this.agentPerformanceData.data.map(d => d.value as number),
          backgroundColor: '#4caf50'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  renderMarketChart(): void {
    if (!this.marketTrendsData) return;
    const canvas = document.getElementById('marketChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.marketChart) {
      this.marketChart.destroy();
    }

    this.marketChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.marketTrendsData.data.map(d => d.date),
        datasets: [{
          label: 'Average Price',
          data: this.marketTrendsData.data.map(d => d.value as number),
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  renderRevenueChart(): void {
    if (!this.revenueForecastData) return;
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const historicalData = this.revenueForecastData.data.filter(d => d.metadata?.['type'] === 'historical');
    const forecastData = this.revenueForecastData.data.filter(d => d.metadata?.['type'] === 'forecast');

    this.revenueChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.revenueForecastData.data.map(d => d.date),
        datasets: [
          {
            label: 'Historical Revenue',
            data: historicalData.map(d => d.value as number),
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          },
          {
            label: 'Forecast',
            data: new Array(historicalData.length).fill(null).concat(forecastData.map(d => d.value as number)),
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  drillDownToCohort(index: number): void {
    const dataPoint = this.cohortData?.data[index];
    if (dataPoint) {
      this.analyticsService.generateQuestionEmbedUrl('2', {
        cohort_month: dataPoint.date
      }).subscribe({
        next: (response) => {
          this.metabaseQuestionUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.embedUrl);
          this.activeTabIndex = 2;
        }
      });
    }
  }

  onDateRangeChange(): void {
    this.loadAnalytics();
  }

  private destroyCharts(): void {
    [this.cohortChart, this.funnelChart, this.agentChart, this.marketChart, this.revenueChart]
      .forEach(chart => chart?.destroy());
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date;
  }

  private getDefaultEndDate(): Date {
    return new Date();
  }
}
