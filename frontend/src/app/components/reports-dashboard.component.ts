import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ReportingApiService,
  KpiReportResponse,
  PipelineSummaryResponse,
  AnalyticsData,
  AgentPerformance,
  RevenueForecast,
  LeadSourceData,
  ConversionFunnel
} from '../services/reporting-api.service';

@Component({
  selector: 'app-reports-dashboard',
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('conversionFunnelCanvas') conversionFunnelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('agentPerformanceCanvas') agentPerformanceCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueForecastCanvas') revenueForecastCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('leadSourceCanvas') leadSourceCanvas!: ElementRef<HTMLCanvasElement>;

  kpiReport: KpiReportResponse | null = null;
  pipelineSummary: PipelineSummaryResponse | null = null;
  analyticsData: AnalyticsData | null = null;
  loading = true;
  error: string | null = null;
  exportingPDF = false;
  exportingCSV = false;
  chartjsLoaded = false;
  chartjsLoading = false;

  dateFrom = '';
  dateTo = '';

  // Chart instances
  private conversionFunnelChart: any = null;
  private agentPerformanceChart: any = null;
  private revenueForecastChart: any = null;
  private leadSourceChart: any = null;

  conversionFunnelChartData: any = {
    labels: [],
    datasets: []
  };
  conversionFunnelChartOptions: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Conversion Funnel by Stage',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.x;
            return `${label}: ${value}`;
          }
        }
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
    },
    onClick: (_event: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const stage = this.analyticsData?.conversionFunnel[index]?.stage;
        if (stage) {
          this.drillDownToStage(stage);
        }
      }
    }
  };
  conversionFunnelChartType = 'bar';

  agentPerformanceChartData: any = {
    labels: [],
    datasets: []
  };
  agentPerformanceChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      title: {
        display: true,
        text: 'Agent Performance Comparison',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      }
    }
  };
  agentPerformanceChartType = 'bar';

  revenueForecastChartData: any = {
    labels: [],
    datasets: []
  };
  revenueForecastChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      title: {
        display: true,
        text: 'Revenue Forecast Over Time',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: €${(value || 0).toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue (€)'
        },
        ticks: {
          callback: (value: any) => '€' + value.toLocaleString()
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
  revenueForecastChartType = 'line';

  leadSourceChartData: any = {
    labels: [],
    datasets: []
  };
  leadSourceChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const
      },
      title: {
        display: true,
        text: 'Lead Sources Distribution',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    onClick: (_event: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const source = this.analyticsData?.leadSources[index]?.source;
        if (source) {
          this.drillDownToSource(source);
        }
      }
    }
  };
  leadSourceChartType = 'pie';

  constructor(
    private reportingService: ReportingApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.dateTo = this.formatDate(today);
    this.dateFrom = this.formatDate(thirtyDaysAgo);

    this.loadReports();
  }

  async ngAfterViewInit(): Promise<void> {
    await this.loadChartJs();
  }

  private async loadChartJs(): Promise<void> {
    if (this.chartjsLoaded || this.chartjsLoading) {
      return;
    }

    this.chartjsLoading = true;

    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      this.chartjsLoaded = true;
      this.chartjsLoading = false;

      // If data already loaded, render charts
      if (this.analyticsData) {
        this.renderAllCharts();
      }
    } catch (error) {
      console.error('Failed to load Chart.js:', error);
      this.chartjsLoading = false;
    }
  }

  private async renderAllCharts(): Promise<void> {
    if (!this.chartjsLoaded || !this.analyticsData) {
      return;
    }

    const { Chart } = await import('chart.js');

    // Render conversion funnel chart
    if (this.conversionFunnelCanvas && this.analyticsData.conversionFunnel.length > 0) {
      if (this.conversionFunnelChart) {
        this.conversionFunnelChart.destroy();
      }
      this.conversionFunnelChart = new Chart(this.conversionFunnelCanvas.nativeElement, {
        type: this.conversionFunnelChartType as any,
        data: this.conversionFunnelChartData,
        options: this.conversionFunnelChartOptions
      });
    }

    // Render agent performance chart
    if (this.agentPerformanceCanvas && this.analyticsData.agentPerformance.length > 0) {
      if (this.agentPerformanceChart) {
        this.agentPerformanceChart.destroy();
      }
      this.agentPerformanceChart = new Chart(this.agentPerformanceCanvas.nativeElement, {
        type: this.agentPerformanceChartType as any,
        data: this.agentPerformanceChartData,
        options: this.agentPerformanceChartOptions
      });
    }

    // Render revenue forecast chart
    if (this.revenueForecastCanvas && this.analyticsData.revenueForecast.length > 0) {
      if (this.revenueForecastChart) {
        this.revenueForecastChart.destroy();
      }
      this.revenueForecastChart = new Chart(this.revenueForecastCanvas.nativeElement, {
        type: this.revenueForecastChartType as any,
        data: this.revenueForecastChartData,
        options: this.revenueForecastChartOptions
      });
    }

    // Render lead source chart
    if (this.leadSourceCanvas && this.analyticsData.leadSources.length > 0) {
      if (this.leadSourceChart) {
        this.leadSourceChart.destroy();
      }
      this.leadSourceChart = new Chart(this.leadSourceCanvas.nativeElement, {
        type: this.leadSourceChartType as any,
        data: this.leadSourceChartData,
        options: this.leadSourceChartOptions
      });
    }
  }

  loadReports(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      kpi: this.reportingService.getKpiReport(this.dateFrom, this.dateTo).pipe(
        catchError(err => { console.error('KPI report error:', err); return of(null); })
      ),
      pipeline: this.reportingService.getPipelineSummary().pipe(
        catchError(err => { console.error('Pipeline summary error:', err); return of(null); })
      ),
      analytics: this.reportingService.getAnalyticsData(this.dateFrom, this.dateTo).pipe(
        catchError(err => { console.error('Analytics data error:', err); return of(null); })
      )
    }).subscribe({
      next: async ({ kpi, pipeline, analytics }) => {
        this.kpiReport = kpi;
        this.pipelineSummary = pipeline;
        if (analytics) {
          this.analyticsData = analytics;
          this.updateConversionFunnelChart(analytics.conversionFunnel);
          this.updateAgentPerformanceChart(analytics.agentPerformance);
          this.updateRevenueForecastChart(analytics.revenueForecast);
          this.updateLeadSourceChart(analytics.leadSources);
        }
        if (!kpi && !pipeline && !analytics) {
          this.error = 'Impossible de charger les rapports.';
        }

        this.loading = false;

        // Render charts if Chart.js already loaded
        if (this.chartjsLoaded) {
          await this.renderAllCharts();
        }
      },
      error: (err) => {
        console.error('Reports load error:', err);
        this.error = 'Erreur lors du chargement des rapports.';
        this.loading = false;
      }
    });
  }

  applyDateFilter(): void {
    this.loadReports();
  }

  parseDate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parts = value.split('-').map(v => Number(v));
    if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
      const fallback = new Date(value);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }

  private updateConversionFunnelChart(data: ConversionFunnel[]): void {
    const stages = data.map(s => s.stage);
    const counts = data.map(s => s.count);
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)'
    ];

    this.conversionFunnelChartData = {
      labels: stages,
      datasets: [
        {
          label: 'Dossiers',
          data: counts,
          backgroundColor: colors.slice(0, stages.length),
          borderColor: colors.slice(0, stages.length).map(c => c.replace('0.8', '1')),
          borderWidth: 1
        }
      ]
    };
  }

  private updateAgentPerformanceChart(data: AgentPerformance[]): void {
    const agents = data.map(a => a.agentName);
    const totalDossiers = data.map(a => a.totalDossiers);
    const closedDossiers = data.map(a => a.closedDossiers);

    this.agentPerformanceChartData = {
      labels: agents,
      datasets: [
        {
          label: 'Total Dossiers',
          data: totalDossiers,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Closed Dossiers',
          data: closedDossiers,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  private updateRevenueForecastChart(data: RevenueForecast[]): void {
    const dates = data.map(d => d.date);
    const estimated = data.map(d => d.estimatedRevenue);
    const actual = data.map(d => d.actualRevenue);
    const pipeline = data.map(d => d.pipelineValue);

    this.revenueForecastChartData = {
      labels: dates,
      datasets: [
        {
          label: 'Estimated Revenue',
          data: estimated,
          fill: false,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Actual Revenue',
          data: actual,
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Pipeline Value',
          data: pipeline,
          fill: false,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4,
          borderWidth: 2,
          borderDash: [5, 5]
        }
      ]
    };
  }

  private updateLeadSourceChart(data: LeadSourceData[]): void {
    const sources = data.map(s => s.source);
    const counts = data.map(s => s.count);
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(255, 102, 196, 0.8)',
      'rgba(102, 255, 178, 0.8)'
    ];

    this.leadSourceChartData = {
      labels: sources,
      datasets: [
        {
          label: 'Lead Count',
          data: counts,
          backgroundColor: colors.slice(0, sources.length),
          borderColor: colors.slice(0, sources.length).map(c => c.replace('0.8', '1')),
          borderWidth: 1
        }
      ]
    };
  }

  async exportToCSV(): Promise<void> {
    if (!this.analyticsData) {
      return;
    }

    this.exportingCSV = true;
    this.error = null;

    try {
      const csvData = this.prepareCSVData();
      const { default: Papa } = await import('papaparse');
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${this.dateFrom}-to-${this.dateTo}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      this.error = 'Failed to export CSV. Please try again.';
    } finally {
      this.exportingCSV = false;
    }
  }

  async exportToPDF(): Promise<void> {
    if (!this.analyticsData) {
      return;
    }

    this.exportingPDF = true;
    this.error = null;

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Analytics Dashboard Report', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Date Range: ${this.dateFrom} to ${this.dateTo}`, pageWidth / 2, 22, { align: 'center' });

      let yPos = 30;

      doc.setFontSize(14);
      doc.text('Key Performance Indicators', 14, yPos);
      yPos += 5;

      if (this.kpiReport) {
        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value']],
          body: [
            ['Average Response Time', `${this.kpiReport.averageResponseTimeHours.toFixed(2)} hours`],
            ['Appointment Show Rate', `${this.kpiReport.appointmentShowRate.toFixed(1)}%`],
            ['Pipeline Velocity', `${this.kpiReport.pipelineVelocityDays.toFixed(1)} days`],
            ['Overall Conversion Rate', `${this.pipelineSummary?.overallConversionRate.toFixed(1)}%`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [54, 162, 235] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Agent Performance', 14, yPos);
      yPos += 5;

      if (this.analyticsData.agentPerformance.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Agent', 'Total Dossiers', 'Closed', 'Conversion Rate', 'Avg Response Time']],
          body: this.analyticsData.agentPerformance.map(agent => [
            agent.agentName,
            agent.totalDossiers.toString(),
            agent.closedDossiers.toString(),
            `${agent.conversionRate.toFixed(1)}%`,
            `${agent.averageResponseTimeHours.toFixed(1)}h`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [75, 192, 192] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Lead Sources', 14, yPos);
      yPos += 5;

      if (this.analyticsData.leadSources.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Source', 'Count', 'Percentage', 'Conversion Rate']],
          body: this.analyticsData.leadSources.map(source => [
            source.source,
            source.count.toString(),
            `${source.percentage.toFixed(1)}%`,
            `${source.conversionRate.toFixed(1)}%`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [153, 102, 255] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Conversion Funnel', 14, yPos);
      yPos += 5;

      if (this.analyticsData.conversionFunnel.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Stage', 'Count', 'Conversion Rate', 'Drop-off Rate']],
          body: this.analyticsData.conversionFunnel.map(stage => [
            stage.stage,
            stage.count.toString(),
            `${stage.conversionRate.toFixed(1)}%`,
            `${stage.dropOffRate.toFixed(1)}%`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [255, 159, 64] }
        });
      }

      doc.save(`analytics-report-${this.dateFrom}-to-${this.dateTo}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      this.error = 'Failed to export PDF. Please try again.';
    } finally {
      this.exportingPDF = false;
    }
  }

  private prepareCSVData(): any[] {
    const data: any[] = [];

    data.push({ Section: 'KEY PERFORMANCE INDICATORS' });
    if (this.kpiReport) {
      data.push({
        Metric: 'Average Response Time',
        Value: `${this.kpiReport.averageResponseTimeHours.toFixed(2)} hours`
      });
      data.push({
        Metric: 'Appointment Show Rate',
        Value: `${this.kpiReport.appointmentShowRate.toFixed(1)}%`
      });
      data.push({
        Metric: 'Pipeline Velocity',
        Value: `${this.kpiReport.pipelineVelocityDays.toFixed(1)} days`
      });
      data.push({
        Metric: 'Overall Conversion Rate',
        Value: `${this.pipelineSummary?.overallConversionRate.toFixed(1)}%`
      });
    }
    data.push({});

    data.push({ Section: 'AGENT PERFORMANCE' });
    if (this.analyticsData?.agentPerformance) {
      this.analyticsData.agentPerformance.forEach(agent => {
        data.push({
          Agent: agent.agentName,
          'Total Dossiers': agent.totalDossiers,
          'Closed Dossiers': agent.closedDossiers,
          'Conversion Rate': `${agent.conversionRate.toFixed(1)}%`,
          'Avg Response Time': `${agent.averageResponseTimeHours.toFixed(1)}h`
        });
      });
    }
    data.push({});

    data.push({ Section: 'LEAD SOURCES' });
    if (this.analyticsData?.leadSources) {
      this.analyticsData.leadSources.forEach(source => {
        data.push({
          Source: source.source,
          Count: source.count,
          Percentage: `${source.percentage.toFixed(1)}%`,
          'Conversion Rate': `${source.conversionRate.toFixed(1)}%`
        });
      });
    }
    data.push({});

    data.push({ Section: 'CONVERSION FUNNEL' });
    if (this.analyticsData?.conversionFunnel) {
      this.analyticsData.conversionFunnel.forEach(stage => {
        data.push({
          Stage: stage.stage,
          Count: stage.count,
          'Conversion Rate': `${stage.conversionRate.toFixed(1)}%`,
          'Drop-off Rate': `${stage.dropOffRate.toFixed(1)}%`
        });
      });
    }
    data.push({});

    data.push({ Section: 'REVENUE FORECAST' });
    if (this.analyticsData?.revenueForecast) {
      this.analyticsData.revenueForecast.forEach(forecast => {
        data.push({
          Date: forecast.date,
          'Estimated Revenue': `€${forecast.estimatedRevenue.toLocaleString()}`,
          'Actual Revenue': `€${forecast.actualRevenue.toLocaleString()}`,
          'Pipeline Value': `€${forecast.pipelineValue.toLocaleString()}`
        });
      });
    }

    return data;
  }

  drillDownToStage(stage: string): void {
    this.router.navigate(['/dossiers'], {
      queryParams: { status: stage }
    });
  }

  drillDownToSource(source: string): void {
    this.router.navigate(['/dossiers'], {
      queryParams: { source: source }
    });
  }

  formatDate(date: Date | null): string {
    if (!date) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
