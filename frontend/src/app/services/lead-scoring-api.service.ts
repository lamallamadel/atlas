import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LeadScoringConfig {
  id?: number;
  configName: string;
  isActive: boolean;
  autoQualificationThreshold: number;
  sourceWeights: { [key: string]: number };
  engagementWeights: { [key: string]: number };
  propertyMatchWeights: { [key: string]: number };
  responseTimeWeight: number;
  fastResponseMinutes: number;
  mediumResponseMinutes: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadScore {
  id: number;
  dossierId: number;
  totalScore: number;
  sourceScore: number;
  responseTimeScore: number;
  engagementScore: number;
  propertyMatchScore: number;
  scoreBreakdown: { [key: string]: any };
  lastCalculatedAt: string;
}

export interface LeadPriority {
  dossier: any;
  score: LeadScore;
  urgencyLevel: 'urgent' | 'high' | 'medium' | 'low';
}

@Injectable({
  providedIn: 'root'
})
export class LeadScoringApiService {
  private apiUrl = '/api/lead-scoring';

  constructor(private http: HttpClient) {}

  getAllConfigs(): Observable<LeadScoringConfig[]> {
    return this.http.get<LeadScoringConfig[]>(`${this.apiUrl}/config`);
  }

  getActiveConfig(): Observable<LeadScoringConfig> {
    return this.http.get<LeadScoringConfig>(`${this.apiUrl}/config/active`);
  }

  getConfig(id: number): Observable<LeadScoringConfig> {
    return this.http.get<LeadScoringConfig>(`${this.apiUrl}/config/${id}`);
  }

  createConfig(config: Partial<LeadScoringConfig>): Observable<LeadScoringConfig> {
    return this.http.post<LeadScoringConfig>(`${this.apiUrl}/config`, config);
  }

  updateConfig(id: number, config: Partial<LeadScoringConfig>): Observable<LeadScoringConfig> {
    return this.http.put<LeadScoringConfig>(`${this.apiUrl}/config/${id}`, config);
  }

  deleteConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/config/${id}`);
  }

  calculateScore(dossierId: number): Observable<LeadScore> {
    return this.http.post<LeadScore>(`${this.apiUrl}/calculate/${dossierId}`, {});
  }

  getScore(dossierId: number): Observable<LeadScore> {
    return this.http.get<LeadScore>(`${this.apiUrl}/score/${dossierId}`);
  }

  getPriorityQueue(limit = 50): Observable<LeadPriority[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<LeadPriority[]>(`${this.apiUrl}/priority-queue`, { params });
  }

  recalculateAllScores(): Observable<{ message: string; orgId: string }> {
    return this.http.post<{ message: string; orgId: string }>(`${this.apiUrl}/recalculate-all`, {});
  }
}
