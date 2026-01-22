/**
 * Reporting API Service
 * 
 * This service provides reporting and export functionality with lazy-loaded dependencies.
 * 
 * Export methods use dynamic imports to load jsPDF and PapaParse only when needed,
 * reducing the initial bundle size by ~600KB.
 * 
 * Example usage:
 * ```typescript
 * // In a component
 * constructor(private reportingService: ReportingApiService) {}
 * 
 * async exportReport() {
 *   const data = await this.reportingService.getAnalyticsData().toPromise();
 *   await this.reportingService.exportAnalyticsToPDF(data);
 * }
 * ```
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConversionRateBySource {
  source: string;
  totalDossiers: number;
  wonDossiers: number;
  conversionRate: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface KpiReportResponse {
  conversionRateBySource: ConversionRateBySource[];
  averageResponseTimeHours: number;
  appointmentShowRate: number;
  pipelineVelocityDays: number;
  dossierCreationTimeSeries: TimeSeriesDataPoint[];
  conversionTimeSeries: TimeSeriesDataPoint[];
}

export interface PipelineStageMetrics {
  stage: string;
  count: number;
  percentage: number;
}

export interface PipelineSummaryResponse {
  stageMetrics: PipelineStageMetrics[];
  totalDossiers: number;
  overallConversionRate: number;
}

export interface AgentPerformance {
  agentName: string;
  totalDossiers: number;
  closedDossiers: number;
  conversionRate: number;
  averageResponseTimeHours: number;
}

export interface RevenueForecast {
  date: string;
  estimatedRevenue: number;
  actualRevenue: number;
  pipelineValue: number;
}

export interface LeadSourceData {
  source: string;
  count: number;
  percentage: number;
  conversionRate: number;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface AnalyticsData {
  agentPerformance: AgentPerformance[];
  revenueForecast: RevenueForecast[];
  leadSources: LeadSourceData[];
  conversionFunnel: ConversionFunnel[];
  dateRange: {
    from: string;
    to: string;
  };
}

export interface ObservabilityMetrics {
  queueMetrics: QueueMetrics;
  latencyMetrics: LatencyMetrics;
  failureMetrics: FailureMetrics;
  dlqMetrics: DlqMetrics;
  quotaMetrics: QuotaMetrics;
  timestamp: string;
}

export interface QueueMetrics {
  queueDepthByChannel: { [channel: string]: number };
  totalQueued: number;
}

export interface LatencyMetrics {
  latencyByChannel: { [channel: string]: LatencyPercentiles };
}

export interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
  average: number;
}

export interface FailureMetrics {
  failuresByChannel: { [channel: string]: number };
  failuresByErrorCode: { [errorCode: string]: number };
  failureTrend: TimeSeriesDataPoint[];
  overallFailureRate: number;
}

export interface DlqMetrics {
  dlqSize: number;
  dlqSizeByChannel: { [channel: string]: number };
  recentDlqMessages: DlqMessage[];
  alertThresholdExceeded: boolean;
  alertThreshold: number;
}

export interface DlqMessage {
  messageId: number;
  channel: string;
  errorCode: string;
  errorMessage: string;
  attemptCount: number;
  lastAttemptAt: string;
}

export interface QuotaMetrics {
  quotaByChannel: { [channel: string]: QuotaUsage };
}

export interface QuotaUsage {
  used: number;
  limit: number;
  usagePercentage: number;
  period: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportingApiService {
  private readonly apiUrl = '/api/v1/reports';

  constructor(private http: HttpClient) { }

  private downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getKpiReport(from?: string, to?: string, orgId?: string): Observable<KpiReportResponse> {
    let params = new HttpParams();
    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }
    if (orgId) {
      params = params.set('orgId', orgId);
    }
    return this.http.get<KpiReportResponse>(`${this.apiUrl}/kpi`, { params });
  }

  getPipelineSummary(orgId?: string): Observable<PipelineSummaryResponse> {
    let params = new HttpParams();
    if (orgId) {
      params = params.set('orgId', orgId);
    }
    return this.http.get<PipelineSummaryResponse>(`${this.apiUrl}/pipeline-summary`, { params });
  }

  getAnalyticsData(from?: string, to?: string, orgId?: string): Observable<AnalyticsData> {
    let params = new HttpParams();
    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }
    if (orgId) {
      params = params.set('orgId', orgId);
    }
    return this.http.get<AnalyticsData>(`${this.apiUrl}/analytics`, { params });
  }

  getObservabilityMetrics(from?: string, to?: string, orgId?: string): Observable<ObservabilityMetrics> {
    let params = new HttpParams();
    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }
    if (orgId) {
      params = params.set('orgId', orgId);
    }
    return this.http.get<ObservabilityMetrics>(`${this.apiUrl}/observability/metrics`, { params });
  }

  exportObservabilityMetrics(format: 'csv' | 'json', from?: string, to?: string, orgId?: string): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }
    if (orgId) {
      params = params.set('orgId', orgId);
    }
    return this.http.get(`${this.apiUrl}/observability/metrics/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  /**
   * Export analytics data to PDF using lazy-loaded jsPDF library.
   * 
   * The jsPDF and jspdf-autotable libraries (~500KB total) are loaded on-demand
   * to avoid bloating the initial bundle.
   * 
   * @param data - Analytics data to export
   * @param filename - Name of the PDF file (default: 'analytics-report.pdf')
   * @returns Promise that resolves when the PDF is downloaded
   * 
   * @example
   * ```typescript
   * const data = await this.reportingService.getAnalyticsData().toPromise();
   * await this.reportingService.exportAnalyticsToPDF(data, 'my-report.pdf');
   * ```
   */
  async exportAnalyticsToPDF(data: AnalyticsData, filename: string = 'analytics-report.pdf'): Promise<void> {
    const [jsPDFModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    
    const { jsPDF: JsPDFClass } = jsPDFModule;
    const doc = new JsPDFClass();

    doc.setFontSize(18);
    doc.text('Analytics Report', 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Date Range: ${data.dateRange.from} to ${data.dateRange.to}`, 14, 30);

    let yPosition = 40;

    if (data.agentPerformance && data.agentPerformance.length > 0) {
      doc.setFontSize(14);
      doc.text('Agent Performance', 14, yPosition);
      yPosition += 10;

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Agent Name', 'Total Dossiers', 'Closed Dossiers', 'Conversion Rate', 'Avg Response Time (hrs)']],
        body: data.agentPerformance.map(agent => [
          agent.agentName,
          agent.totalDossiers.toString(),
          agent.closedDossiers.toString(),
          `${(agent.conversionRate * 100).toFixed(2)}%`,
          agent.averageResponseTimeHours.toFixed(2)
        ]),
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    if (data.leadSources && data.leadSources.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Lead Sources', 14, yPosition);
      yPosition += 10;

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Source', 'Count', 'Percentage', 'Conversion Rate']],
        body: data.leadSources.map(source => [
          source.source,
          source.count.toString(),
          `${source.percentage.toFixed(2)}%`,
          `${(source.conversionRate * 100).toFixed(2)}%`
        ]),
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    if (data.conversionFunnel && data.conversionFunnel.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Conversion Funnel', 14, yPosition);
      yPosition += 10;

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Stage', 'Count', 'Conversion Rate', 'Drop-off Rate']],
        body: data.conversionFunnel.map(stage => [
          stage.stage,
          stage.count.toString(),
          `${(stage.conversionRate * 100).toFixed(2)}%`,
          `${(stage.dropOffRate * 100).toFixed(2)}%`
        ]),
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    }

    doc.save(filename);
  }

  /**
   * Export analytics data to CSV using lazy-loaded PapaParse library.
   * 
   * The PapaParse library (~100KB) is loaded on-demand to avoid bloating
   * the initial bundle.
   * 
   * @param data - Analytics data to export
   * @param filename - Name of the CSV file (default: 'analytics-report.csv')
   * @returns Promise that resolves when the CSV is downloaded
   * 
   * @example
   * ```typescript
   * const data = await this.reportingService.getAnalyticsData().toPromise();
   * await this.reportingService.exportAnalyticsToCSV(data, 'my-report.csv');
   * ```
   */
  async exportAnalyticsToCSV(data: AnalyticsData, filename: string = 'analytics-report.csv'): Promise<void> {
    const Papa = await import('papaparse');

    const csvSections: string[] = [];

    csvSections.push(`Analytics Report - Date Range: ${data.dateRange.from} to ${data.dateRange.to}\n`);

    if (data.agentPerformance && data.agentPerformance.length > 0) {
      csvSections.push('\nAgent Performance');
      const agentData = data.agentPerformance.map(agent => ({
        'Agent Name': agent.agentName,
        'Total Dossiers': agent.totalDossiers,
        'Closed Dossiers': agent.closedDossiers,
        'Conversion Rate': `${(agent.conversionRate * 100).toFixed(2)}%`,
        'Avg Response Time (hrs)': agent.averageResponseTimeHours.toFixed(2)
      }));
      csvSections.push(Papa.unparse(agentData));
    }

    if (data.leadSources && data.leadSources.length > 0) {
      csvSections.push('\n\nLead Sources');
      const leadSourceData = data.leadSources.map(source => ({
        'Source': source.source,
        'Count': source.count,
        'Percentage': `${source.percentage.toFixed(2)}%`,
        'Conversion Rate': `${(source.conversionRate * 100).toFixed(2)}%`
      }));
      csvSections.push(Papa.unparse(leadSourceData));
    }

    if (data.conversionFunnel && data.conversionFunnel.length > 0) {
      csvSections.push('\n\nConversion Funnel');
      const funnelData = data.conversionFunnel.map(stage => ({
        'Stage': stage.stage,
        'Count': stage.count,
        'Conversion Rate': `${(stage.conversionRate * 100).toFixed(2)}%`,
        'Drop-off Rate': `${(stage.dropOffRate * 100).toFixed(2)}%`
      }));
      csvSections.push(Papa.unparse(funnelData));
    }

    if (data.revenueForecast && data.revenueForecast.length > 0) {
      csvSections.push('\n\nRevenue Forecast');
      const forecastData = data.revenueForecast.map(forecast => ({
        'Date': forecast.date,
        'Estimated Revenue': forecast.estimatedRevenue,
        'Actual Revenue': forecast.actualRevenue,
        'Pipeline Value': forecast.pipelineValue
      }));
      csvSections.push(Papa.unparse(forecastData));
    }

    const csvContent = csvSections.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  /**
   * Export KPI report data to PDF using lazy-loaded jsPDF library.
   * 
   * @param data - KPI report data to export
   * @param filename - Name of the PDF file (default: 'kpi-report.pdf')
   * @returns Promise that resolves when the PDF is downloaded
   */
  async exportKpiReportToPDF(data: KpiReportResponse, filename: string = 'kpi-report.pdf'): Promise<void> {
    const [jsPDFModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    
    const { jsPDF: JsPDFClass } = jsPDFModule;
    const doc = new JsPDFClass();

    doc.setFontSize(18);
    doc.text('KPI Report', 14, 20);

    let yPosition = 35;

    doc.setFontSize(12);
    doc.text('Key Metrics', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Average Response Time: ${data.averageResponseTimeHours.toFixed(2)} hours`, 14, yPosition);
    yPosition += 6;
    doc.text(`Appointment Show Rate: ${(data.appointmentShowRate * 100).toFixed(2)}%`, 14, yPosition);
    yPosition += 6;
    doc.text(`Pipeline Velocity: ${data.pipelineVelocityDays.toFixed(2)} days`, 14, yPosition);
    yPosition += 15;

    if (data.conversionRateBySource && data.conversionRateBySource.length > 0) {
      doc.setFontSize(12);
      doc.text('Conversion Rate by Source', 14, yPosition);
      yPosition += 10;

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Source', 'Total Dossiers', 'Won Dossiers', 'Conversion Rate']],
        body: data.conversionRateBySource.map(item => [
          item.source,
          item.totalDossiers.toString(),
          item.wonDossiers.toString(),
          `${(item.conversionRate * 100).toFixed(2)}%`
        ]),
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    }

    doc.save(filename);
  }

  /**
   * Export KPI report data to CSV using lazy-loaded PapaParse library.
   * 
   * @param data - KPI report data to export
   * @param filename - Name of the CSV file (default: 'kpi-report.csv')
   * @returns Promise that resolves when the CSV is downloaded
   */
  async exportKpiReportToCSV(data: KpiReportResponse, filename: string = 'kpi-report.csv'): Promise<void> {
    const Papa = await import('papaparse');

    const csvSections: string[] = [];

    csvSections.push('KPI Report\n');
    csvSections.push(`Average Response Time (hours),${data.averageResponseTimeHours.toFixed(2)}`);
    csvSections.push(`Appointment Show Rate,${(data.appointmentShowRate * 100).toFixed(2)}%`);
    csvSections.push(`Pipeline Velocity (days),${data.pipelineVelocityDays.toFixed(2)}`);

    if (data.conversionRateBySource && data.conversionRateBySource.length > 0) {
      csvSections.push('\n\nConversion Rate by Source');
      const conversionData = data.conversionRateBySource.map(item => ({
        'Source': item.source,
        'Total Dossiers': item.totalDossiers,
        'Won Dossiers': item.wonDossiers,
        'Conversion Rate': `${(item.conversionRate * 100).toFixed(2)}%`
      }));
      csvSections.push(Papa.unparse(conversionData));
    }

    if (data.dossierCreationTimeSeries && data.dossierCreationTimeSeries.length > 0) {
      csvSections.push('\n\nDossier Creation Time Series');
      csvSections.push(Papa.unparse(data.dossierCreationTimeSeries));
    }

    if (data.conversionTimeSeries && data.conversionTimeSeries.length > 0) {
      csvSections.push('\n\nConversion Time Series');
      csvSections.push(Papa.unparse(data.conversionTimeSeries));
    }

    const csvContent = csvSections.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }
}
