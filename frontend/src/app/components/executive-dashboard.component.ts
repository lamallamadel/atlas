import { Component, OnInit } from '@angular/core';
import { ReportingApiService, AnalyticsData } from '../services/reporting-api.service';
import { PredictiveAnalyticsService, PipelineForecast } from '../services/predictive-analytics.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';

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
  templateUrl: './executive-dashboard.component.html',
  styleUrls: ['./executive-dashboard.component.scss']
})
export class ExecutiveDashboardComponent implements OnInit {
  loading = false;
  
  kpis: ExecutiveKPI[] = [];
  
  revenueForecastData: PipelineForecast[] = [];
  
  teamPerformanceChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };
  
  teamPerformanceChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Team Performance Heatmap'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Agent'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Performance Score'
        }
      }
    }
  };

  marketTrendsChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  marketTrendsChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Market Trends - Average Property Values'
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => {
            return '€' + value.toLocaleString();
          }
        }
      }
    }
  };

  pipelineForecastChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  pipelineForecastChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Revenue Forecast (30 Days)'
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => {
            return '€' + value.toLocaleString();
          }
        }
      }
    }
  };

  constructor(
    private reportingService: ReportingApiService,
    private predictiveAnalytics: PredictiveAnalyticsService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);

    this.reportingService.getAnalyticsData(
      from.toISOString().split('T')[0],
      to.toISOString().split('T')[0]
    ).subscribe({
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
      {
        label: 'Total Revenue',
        value: '€' + totalRevenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 }),
        change: 12.5,
        trend: 'up',
        icon: 'attach_money',
        color: '#4caf50'
      },
      {
        label: 'Pipeline Value',
        value: '€' + pipelineValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 }),
        change: 8.3,
        trend: 'up',
        icon: 'trending_up',
        color: '#2196f3'
      },
      {
        label: 'Win Rate',
        value: (winRate * 100).toFixed(1) + '%',
        change: -2.1,
        trend: 'down',
        icon: 'flag',
        color: '#ff9800'
      },
      {
        label: 'Active Leads',
        value: totalLeads,
        change: 5.7,
        trend: 'up',
        icon: 'people',
        color: '#9c27b0'
      },
      {
        label: 'Team Performance',
        value: '87%',
        change: 3.2,
        trend: 'up',
        icon: 'star',
        color: '#00bcd4'
      },
      {
        label: 'Avg Deal Time',
        value: '23 days',
        change: -6.4,
        trend: 'up',
        icon: 'schedule',
        color: '#ff5722'
      }
    ];
  }

  private processTeamPerformance(data: AnalyticsData): void {
    if (!data.agentPerformance || data.agentPerformance.length === 0) {
      this.loadMockTeamPerformance();
      return;
    }

    const agents = data.agentPerformance.map(a => a.agentName);
    const conversionScores = data.agentPerformance.map(a => a.conversionRate * 100);
    const responseScores = data.agentPerformance.map(a => 
      Math.max(0, 100 - a.averageResponseTimeHours * 2)
    );

    this.teamPerformanceChartData = {
      labels: agents,
      datasets: [
        {
          label: 'Conversion Rate',
          data: conversionScores,
          backgroundColor: 'rgba(76, 175, 80, 0.6)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        },
        {
          label: 'Response Score',
          data: responseScores,
          backgroundColor: 'rgba(33, 150, 243, 0.6)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  private processRevenueForecast(data: AnalyticsData): void {
    if (!data.revenueForecast || data.revenueForecast.length === 0) {
      this.loadMockForecast();
      return;
    }

    const historicalData = data.revenueForecast.map(r => ({
      date: r.date,
      value: r.pipelineValue
    }));

    this.revenueForecastData = this.predictiveAnalytics.forecastPipelineValue(historicalData, 30);

    const allDates = [
      ...historicalData.map(d => d.date),
      ...this.revenueForecastData.map(f => f.date)
    ];

    const historicalValues = historicalData.map(d => d.value);
    const forecastValues = new Array(historicalData.length).fill(null).concat(
      this.revenueForecastData.map(f => f.predictedValue)
    );

    this.pipelineForecastChartData = {
      labels: allDates,
      datasets: [
        {
          label: 'Historical',
          data: historicalValues.concat(new Array(this.revenueForecastData.length).fill(null)),
          borderColor: 'rgba(33, 150, 243, 1)',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true
        },
        {
          label: 'Forecast',
          data: forecastValues,
          borderColor: 'rgba(255, 152, 0, 1)',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderDash: [5, 5],
          fill: true
        }
      ]
    };
  }

  private processMarketTrends(): void {
    const mockPrices = [
      { date: '2024-01', avgPrice: 350000 },
      { date: '2024-02', avgPrice: 355000 },
      { date: '2024-03', avgPrice: 358000 },
      { date: '2024-04', avgPrice: 362000 },
      { date: '2024-05', avgPrice: 365000 },
      { date: '2024-06', avgPrice: 368000 }
    ];

    const predictions = this.predictiveAnalytics.predictMarketTrend(mockPrices, 6);

    const allDates = [
      ...mockPrices.map(p => p.date),
      ...predictions.map(p => p.date)
    ];

    const historicalPrices = mockPrices.map(p => p.avgPrice);
    const predictedPrices = new Array(mockPrices.length).fill(null).concat(
      predictions.map(p => p.predictedPrice)
    );

    this.marketTrendsChartData = {
      labels: allDates,
      datasets: [
        {
          label: 'Historical Prices',
          data: historicalPrices.concat(new Array(predictions.length).fill(null)),
          borderColor: 'rgba(76, 175, 80, 1)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true
        },
        {
          label: 'Predicted Prices',
          data: predictedPrices,
          borderColor: 'rgba(244, 67, 54, 1)',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderDash: [5, 5],
          fill: true
        }
      ]
    };
  }

  private loadMockData(): void {
    this.kpis = [
      {
        label: 'Total Revenue',
        value: '€2,450,000',
        change: 12.5,
        trend: 'up',
        icon: 'attach_money',
        color: '#4caf50'
      },
      {
        label: 'Pipeline Value',
        value: '€8,750,000',
        change: 8.3,
        trend: 'up',
        icon: 'trending_up',
        color: '#2196f3'
      },
      {
        label: 'Win Rate',
        value: '32.5%',
        change: -2.1,
        trend: 'down',
        icon: 'flag',
        color: '#ff9800'
      },
      {
        label: 'Active Leads',
        value: 245,
        change: 5.7,
        trend: 'up',
        icon: 'people',
        color: '#9c27b0'
      },
      {
        label: 'Team Performance',
        value: '87%',
        change: 3.2,
        trend: 'up',
        icon: 'star',
        color: '#00bcd4'
      },
      {
        label: 'Avg Deal Time',
        value: '23 days',
        change: -6.4,
        trend: 'up',
        icon: 'schedule',
        color: '#ff5722'
      }
    ];

    this.loadMockTeamPerformance();
    this.loadMockForecast();
    this.processMarketTrends();
  }

  private loadMockTeamPerformance(): void {
    this.teamPerformanceChartData = {
      labels: ['Agent 1', 'Agent 2', 'Agent 3', 'Agent 4', 'Agent 5'],
      datasets: [
        {
          label: 'Conversion Rate',
          data: [85, 92, 78, 88, 95],
          backgroundColor: 'rgba(76, 175, 80, 0.6)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        },
        {
          label: 'Response Score',
          data: [90, 85, 88, 92, 87],
          backgroundColor: 'rgba(33, 150, 243, 0.6)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  private loadMockForecast(): void {
    const historicalData = [
      { date: '2024-01-01', value: 2000000 },
      { date: '2024-02-01', value: 2200000 },
      { date: '2024-03-01', value: 2400000 }
    ];

    this.revenueForecastData = this.predictiveAnalytics.forecastPipelineValue(historicalData, 30);

    this.pipelineForecastChartData = {
      labels: [...historicalData.map(d => d.date), ...this.revenueForecastData.map(f => f.date)],
      datasets: [
        {
          label: 'Historical',
          data: historicalData.map(d => d.value).concat(new Array(this.revenueForecastData.length).fill(null)),
          borderColor: 'rgba(33, 150, 243, 1)',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true
        },
        {
          label: 'Forecast',
          data: new Array(historicalData.length).fill(null).concat(this.revenueForecastData.map(f => f.predictedValue)),
          borderColor: 'rgba(255, 152, 0, 1)',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderDash: [5, 5],
          fill: true
        }
      ]
    };
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
