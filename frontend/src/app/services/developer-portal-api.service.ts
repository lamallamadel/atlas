import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiKey,
  CreateApiKeyRequest,
  WebhookSubscription,
  CreateWebhookRequest,
  WebhookDelivery,
  ApiUsage,
  WebhookStatus
} from '../models/api-marketplace.models';

@Injectable({
  providedIn: 'root'
})
export class DeveloperPortalApiService {
  private baseUrl = '/api/v1/developer';

  constructor(private http: HttpClient) {}

  // API Keys
  createApiKey(request: CreateApiKeyRequest): Observable<ApiKey> {
    return this.http.post<ApiKey>(`${this.baseUrl}/api-keys`, request);
  }

  listApiKeys(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(`${this.baseUrl}/api-keys`);
  }

  getApiKey(id: number): Observable<ApiKey> {
    return this.http.get<ApiKey>(`${this.baseUrl}/api-keys/${id}`);
  }

  revokeApiKey(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api-keys/${id}`);
  }

  getApiKeyUsage(id: number, days: number = 30): Observable<ApiUsage[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ApiUsage[]>(`${this.baseUrl}/api-keys/${id}/usage`, { params });
  }

  // Webhooks
  createWebhook(request: CreateWebhookRequest): Observable<WebhookSubscription> {
    return this.http.post<WebhookSubscription>(`${this.baseUrl}/webhooks`, request);
  }

  listWebhooks(): Observable<WebhookSubscription[]> {
    return this.http.get<WebhookSubscription[]>(`${this.baseUrl}/webhooks`);
  }

  getWebhook(id: number): Observable<WebhookSubscription> {
    return this.http.get<WebhookSubscription>(`${this.baseUrl}/webhooks/${id}`);
  }

  updateWebhookStatus(id: number, status: WebhookStatus): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/webhooks/${id}/status`, { status });
  }

  deleteWebhook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/webhooks/${id}`);
  }

  getWebhookDeliveries(id: number, page: number = 0, size: number = 20): Observable<{ content: WebhookDelivery[] }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<{ content: WebhookDelivery[] }>(`${this.baseUrl}/webhooks/${id}/deliveries`, { params });
  }
}
