import { Component, OnInit } from '@angular/core';
import { ReportingApiService, KpiReportResponse, PipelineSummaryResponse } from '../services/reporting-api.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-reports-dashboard',
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements OnInit {
  kpiReport: KpiReportResponse | null = null;
  pipelineSummary: PipelineSummaryResponse | null = null;
  loading = true;
  error: string | null = null;

  dateFrom: string = '';
  dateTo: string = '';

  conversionBySourceChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  conversionBySourceChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Conversion Rate by Source'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Conversion Rate (%)'
        }
      }
    }
  };
  conversionBySourceChartType: ChartType = 'bar';

  pipelineFunnelChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  pipelineFunnelChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Pipeline Funnel'
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Dossiers'
        }
      }
    }
  };
  pipelineFunnelChartType: ChartType = 'bar';

  dossierTimeSeriesChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  dossierTimeSeriesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Dossier Creation Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };
  dossierTimeSeriesChartType: ChartType = 'line';

  conversionTimeSeriesChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  conversionTimeSeriesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Conversions Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Conversions'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };
  conversionTimeSeriesChartType: ChartType = 'line';

  constructor(private reportingService: ReportingApiService) { }

  ngOnInit(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.dateTo = this.formatDate(today);
    this.dateFrom = this.formatDate(thirtyDaysAgo);

    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.error = null;

    this.reportingService.getKpiReport(this.dateFrom, this.dateTo).subscribe({
      next: (data) => {
        this.kpiReport = data;
        this.updateConversionBySourceChart(data);
        this.updateDossierTimeSeriesChart(data);
        this.updateConversionTimeSeriesChart(data);
      },
      error: (err) => {
        this.error = 'Failed to load KPI report';
        console.error(err);
        this.loading = false;
      }
    });

    this.reportingService.getPipelineSummary().subscribe({
      next: (data) => {
        this.pipelineSummary = data;
        this.updatePipelineFunnelChart(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load pipeline summary';
        console.error(err);
        this.loading = false;
      }
    });
  }

  applyDateFilter(): void {
    this.loadReports();
  }

  private updateConversionBySourceChart(data: KpiReportResponse): void {
    const sources = data.conversionRateBySource.map(s => s.source);
    const conversionRates = data.conversionRateBySource.map(s => s.conversionRate);

    this.conversionBySourceChartData = {
      labels: sources,
      datasets: [
        {
          label: 'Conversion Rate (%)',
          data: conversionRates,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  private updatePipelineFunnelChart(data: PipelineSummaryResponse): void {
    const stages = data.stageMetrics.map(s => s.stage);
    const counts = data.stageMetrics.map(s => s.count);

    this.pipelineFunnelChartData = {
      labels: stages,
      datasets: [
        {
          label: 'Dossiers',
          data: counts,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }

  private updateDossierTimeSeriesChart(data: KpiReportResponse): void {
    const dates = data.dossierCreationTimeSeries.map(d => d.date);
    const values = data.dossierCreationTimeSeries.map(d => d.value);

    this.dossierTimeSeriesChartData = {
      labels: dates,
      datasets: [
        {
          label: 'Dossiers Created',
          data: values,
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }
      ]
    };
  }

  private updateConversionTimeSeriesChart(data: KpiReportResponse): void {
    const dates = data.conversionTimeSeries.map(d => d.date);
    const values = data.conversionTimeSeries.map(d => d.value);

    this.conversionTimeSeriesChartData = {
      labels: dates,
      datasets: [
        {
          label: 'Conversions',
          data: values,
          fill: false,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.1
        }
      ]
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
