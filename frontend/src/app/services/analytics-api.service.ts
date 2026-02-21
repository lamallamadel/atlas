import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MetabaseEmbedRequest {
  dashboardId: string;
  params?: Record<string, any>;
  expirationMinutes?: number;
}

export interface MetabaseEmbedResponse {
  embedUrl: string;
  token: string;
  expiresAt: number;
}

export interface AnalyticsDataPoint {
  date: string;
  value: any;
  metadata?: Record<string, any>;
}

export interface AnalyticsResponse {
  metricType: string;
  data: AnalyticsDataPoint[];
  summary?: Record<string, any>;
}

export interface ScheduledReportRequest {
  name: string;
  description?: string;
  reportType: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  format: 'PDF' | 'CSV' | 'EXCEL' | 'HTML';
  recipients: string[];
  parameters?: Record<string, any>;
  dayOfWeek?: string;
  dayOfMonth?: number;
  hour?: number;
  enabled?: boolean;
}

export interface ScheduledReportResponse extends ScheduledReportRequest {
  id: number;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: string;
  runCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomQuery {
  id?: number;
  name: string;
  description?: string;
  sqlQuery: string;
  parameters?: Array<Record<string, any>>;
  isPublic?: boolean;
  category?: string;
  executionCount?: number;
  avgExecutionTimeMs?: number;
  isApproved?: boolean;
  approvedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsApiService {
  private apiUrl = '/api/v1/analytics';
  private reportsUrl = '/api/v1/scheduled-reports';
  private queriesUrl = '/api/v1/custom-queries';

  constructor(private http: HttpClient) {}

  generateMetabaseEmbedUrl(request: MetabaseEmbedRequest): Observable<MetabaseEmbedResponse> {
    return this.http.post<MetabaseEmbedResponse>(`${this.apiUrl}/metabase/embed`, request);
  }

  generateQuestionEmbedUrl(questionId: string, params: Record<string, any>): Observable<MetabaseEmbedResponse> {
    return this.http.post<MetabaseEmbedResponse>(
      `${this.apiUrl}/metabase/question/${questionId}/embed`,
      params
    );
  }

  getMetabaseSSOToken(): Observable<{ token: string }> {
    return this.http.get<{ token: string }>(`${this.apiUrl}/metabase/sso-token`);
  }

  getCohortAnalysis(startDate: string, endDate: string): Observable<AnalyticsResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<AnalyticsResponse>(`${this.apiUrl}/cohort-analysis`, { params });
  }

  getFunnelVisualization(startDate: string, endDate: string): Observable<AnalyticsResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<AnalyticsResponse>(`${this.apiUrl}/funnel`, { params });
  }

  getAgentPerformanceLeaderboard(startDate: string, endDate: string): Observable<AnalyticsResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<AnalyticsResponse>(`${this.apiUrl}/agent-performance`, { params });
  }

  getPropertyMarketTrends(startDate: string, endDate: string): Observable<AnalyticsResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<AnalyticsResponse>(`${this.apiUrl}/market-trends`, { params });
  }

  getRevenueForecast(forecastMonths: number = 6): Observable<AnalyticsResponse> {
    const params = new HttpParams().set('forecastMonths', forecastMonths.toString());
    return this.http.get<AnalyticsResponse>(`${this.apiUrl}/revenue-forecast`, { params });
  }

  createScheduledReport(request: ScheduledReportRequest): Observable<ScheduledReportResponse> {
    return this.http.post<ScheduledReportResponse>(this.reportsUrl, request);
  }

  getScheduledReports(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.reportsUrl, { params });
  }

  getScheduledReport(id: number): Observable<ScheduledReportResponse> {
    return this.http.get<ScheduledReportResponse>(`${this.reportsUrl}/${id}`);
  }

  updateScheduledReport(id: number, request: ScheduledReportRequest): Observable<ScheduledReportResponse> {
    return this.http.put<ScheduledReportResponse>(`${this.reportsUrl}/${id}`, request);
  }

  deleteScheduledReport(id: number): Observable<void> {
    return this.http.delete<void>(`${this.reportsUrl}/${id}`);
  }

  createCustomQuery(query: CustomQuery): Observable<CustomQuery> {
    return this.http.post<CustomQuery>(this.queriesUrl, query);
  }

  getCustomQueries(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.queriesUrl, { params });
  }

  getCustomQuery(id: number): Observable<CustomQuery> {
    return this.http.get<CustomQuery>(`${this.queriesUrl}/${id}`);
  }

  updateCustomQuery(id: number, query: CustomQuery): Observable<CustomQuery> {
    return this.http.put<CustomQuery>(`${this.queriesUrl}/${id}`, query);
  }

  deleteCustomQuery(id: number): Observable<void> {
    return this.http.delete<void>(`${this.queriesUrl}/${id}`);
  }

  executeCustomQuery(id: number, params: Record<string, any>): Observable<Array<Record<string, any>>> {
    return this.http.post<Array<Record<string, any>>>(`${this.queriesUrl}/${id}/execute`, params);
  }

  approveCustomQuery(id: number): Observable<CustomQuery> {
    return this.http.post<CustomQuery>(`${this.queriesUrl}/${id}/approve`, {});
  }

  getPublicQueries(): Observable<CustomQuery[]> {
    return this.http.get<CustomQuery[]>(`${this.queriesUrl}/public`);
  }

  getQueriesByCategory(category: string): Observable<CustomQuery[]> {
    return this.http.get<CustomQuery[]>(`${this.queriesUrl}/category/${category}`);
  }
}
