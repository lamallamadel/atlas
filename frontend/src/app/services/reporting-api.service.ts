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
}
