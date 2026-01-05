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
}
