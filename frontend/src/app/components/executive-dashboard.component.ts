import { Component, OnInit, inject } from '@angular/core';
import { ReportingApiService, AnalyticsData } from '../services/reporting-api.service';
import { PredictiveAnalyticsService, PipelineForecast } from '../services/predictive-analytics.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { DsCardComponent, DsButtonComponent, DsIconComponent, DsSkeletonComponent } from '../design-system';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';

interface ExecutiveKPI {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

@Component({
    selector: 'app-executive-dashboard',
    standalone: true,
    templateUrl: './executive-dashboard.component.html',
    styleUrls: ['./executive-dashboard.component.scss'],
    imports: [
      CommonModule,
      DsButtonComponent, 
      DsIconComponent, 
      DsCardComponent, 
      DsSkeletonComponent, 
      NgChartsModule
    ]
})
export class ExecutiveDashboardComponent implements OnInit {
  private reportingService = inject(ReportingApiService);
  private predictiveAnalytics = inject(PredictiveAnalyticsService);

  loading = false;
  kpis: ExecutiveKPI[] = [];
  revenueForecastData: PipelineForecast[] = [];
  
  teamPerformanceChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  teamPerformanceChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: true, position: 'top' }, title: { display: true, text: 'Team Performance Heatmap' } },
    scales: { x: { title: { display: true, text: 'Agent' } }, y: { title: { display: true, text: 'Performance Score' } } }
  };

  marketTrendsChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  marketTrendsChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: true, position: 'top' }, title: { display: true, text: 'Market Trends' } },
    scales: { y: { ticks: { callback: (value) => '€' + value.toLocaleString() } } }
  };

  pipelineForecastChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  pipelineForecastChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: true, position: 'top' }, title: { display: true, text: 'Revenue Forecast' } },
    scales: { y: { ticks: { callback: (value) => '€' + value.toLocaleString() } } }
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);

    this.reportingService.getAnalyticsData(from.toISOString().split('T')[0], to.toISOString().split('T')[0]).subscribe({
      next: (data) => {
        this.processKPIs(data);
        this.processTeamPerformance(data);
        this.processRevenueForecast(data);
        this.processMarketTrends();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
        this.loadMockData();
        this.loading = false;
      }
    });
  }

  private processKPIs(data: AnalyticsData): void {
    const totalRevenue = data.revenueForecast?.reduce((sum, r) => sum + r.actualRevenue, 0) || 0;
    const pipelineValue = data.revenueForecast?.[data.revenueForecast.length - 1]?.pipelineValue || 0;
    const winRate = data.conversionFunnel?.find(f => f.stage === 'WON')?.conversionRate || 0;
    const totalLeads = data.leadSources?.reduce((sum, s) => sum + s.count, 0) || 0;

    this.kpis = [
      { label: 'Total Revenue', value: '€' + totalRevenue.toLocaleString('fr-FR'), change: 12.5, trend: 'up', icon: 'coin', color: 'var(--ds-success)' },
      { label: 'Pipeline Value', value: '€' + pipelineValue.toLocaleString('fr-FR'), change: 8.3, trend: 'up', icon: 'chart', color: 'var(--ds-primary)' },
      { label: 'Win Rate', value: (winRate * 100).toFixed(1) + '%', change: -2.1, trend: 'down', icon: 'check', color: 'var(--ds-warning)' },
      { label: 'Active Leads', value: totalLeads, change: 5.7, trend: 'up', icon: 'users', color: 'var(--ds-marine)' }
    ];
  }

  private processTeamPerformance(data: AnalyticsData): void {
    if (!data.agentPerformance || data.agentPerformance.length === 0) { this.loadMockTeamPerformance(); return; }
    const agents = data.agentPerformance.map(a => a.agentName);
    const conversionScores = data.agentPerformance.map(a => a.conversionRate * 100);
    this.teamPerformanceChartData = {
      labels: agents,
      datasets: [
        { label: 'Conversion Rate', data: conversionScores, backgroundColor: 'rgba(76, 175, 80, 0.6)', borderColor: 'rgba(76, 175, 80, 1)', borderWidth: 1 }
      ]
    };
  }

  private processRevenueForecast(data: AnalyticsData): void {
    if (!data.revenueForecast || data.revenueForecast.length === 0) { this.loadMockForecast(); return; }
    const historicalData = data.revenueForecast.map(r => ({ date: r.date, value: r.pipelineValue }));
    this.revenueForecastData = this.predictiveAnalytics.forecastPipelineValue(historicalData, 30);
    const allDates = [...historicalData.map(d => d.date), ...this.revenueForecastData.map(f => f.date)];
    this.pipelineForecastChartData = {
      labels: allDates,
      datasets: [
        { label: 'Historical', data: historicalData.map(d => d.value).concat(new Array(this.revenueForecastData.length).fill(null)), borderColor: 'rgba(33, 150, 243, 1)', backgroundColor: 'rgba(33, 150, 243, 0.1)', fill: true },
        { label: 'Forecast', data: new Array(historicalData.length).fill(null).concat(this.revenueForecastData.map(f => f.predictedValue)), borderColor: 'rgba(255, 152, 0, 1)', backgroundColor: 'rgba(255, 152, 0, 0.1)', borderDash: [5, 5], fill: true }
      ]
    };
  }

  private processMarketTrends(): void {
    const mockPrices = [{ date: '2024-01', avgPrice: 350000 }, { date: '2024-02', avgPrice: 355000 }, { date: '2024-03', avgPrice: 358000 }];
    const predictions = this.predictiveAnalytics.predictMarketTrend(mockPrices, 6);
    this.marketTrendsChartData = {
      labels: [...mockPrices.map(p => p.date), ...predictions.map(p => p.date)],
      datasets: [
        { label: 'Historical', data: mockPrices.map(p => p.avgPrice).concat(new Array(predictions.length).fill(null)), borderColor: 'rgba(76, 175, 80, 1)', backgroundColor: 'rgba(76, 175, 80, 0.1)', fill: true },
        { label: 'Predicted', data: new Array(mockPrices.length).fill(null).concat(predictions.map(p => p.predictedPrice)), borderColor: 'rgba(244, 67, 54, 1)', backgroundColor: 'rgba(244, 67, 54, 0.1)', borderDash: [5, 5], fill: true }
      ]
    };
  }

  private loadMockData(): void {
    this.kpis = [
      { label: 'Total Revenue', value: '€2,450,000', change: 12.5, trend: 'up', icon: 'coin', color: 'var(--ds-success)' },
      { label: 'Pipeline Value', value: '€8,750,000', change: 8.3, trend: 'up', icon: 'chart', color: 'var(--ds-primary)' }
    ];
    this.loadMockTeamPerformance();
    this.loadMockForecast();
    this.processMarketTrends();
  }

  private loadMockTeamPerformance(): void {
    this.teamPerformanceChartData = {
      labels: ['Agent 1', 'Agent 2'],
      datasets: [{ label: 'Conversion', data: [85, 92], backgroundColor: 'rgba(76, 175, 80, 0.6)', borderWidth: 1 }]
    };
  }

  private loadMockForecast(): void {
    this.pipelineForecastChartData = {
      labels: ['2024-01', '2024-02'],
      datasets: [{ label: 'Forecast', data: [2000000, 2200000], borderColor: 'rgba(255, 152, 0, 1)', fill: true }]
    };
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
