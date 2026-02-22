import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MLService {
  private apiUrl = `${environment.apiBaseUrl}/api/ml`;

  constructor(private http: HttpClient) { }

  predictConversion(dossierId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/predict/${dossierId}`, {});
  }

  getLatestPrediction(dossierId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/predict/${dossierId}/latest`);
  }

  getPredictionHistory(dossierId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/predict/${dossierId}/history`);
  }

  recordOutcome(dossierId: number, outcome: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/predict/${dossierId}/outcome`, null, {
      params: { outcome: outcome.toString() }
    });
  }

  getModelInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/model/info`);
  }

  getFeatureImportance(): Observable<any> {
    return this.http.get(`${this.apiUrl}/model/feature-importance`);
  }

  trainModel(): Observable<any> {
    return this.http.post(`${this.apiUrl}/model/train`, {});
  }

  getModelVersions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/model/versions`);
  }

  rollbackModel(version: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/model/rollback/${version}`, {});
  }

  createExperiment(experimentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ab-test`, experimentData);
  }

  getExperiments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ab-test`);
  }

  getExperimentMetrics(experimentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/ab-test/${experimentId}/metrics`);
  }

  stopExperiment(experimentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ab-test/${experimentId}/stop`, {});
  }
}
