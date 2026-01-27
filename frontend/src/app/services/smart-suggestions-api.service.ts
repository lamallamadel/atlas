import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SmartSuggestion {
  id?: number;
  suggestionType: string;
  title: string;
  description: string;
  actionType: string;
  actionPayload?: Record<string, any>;
  priority: number;
  confidenceScore?: number;
  reason?: string;
}

export interface MessageTemplate {
  id: number;
  name: string;
  category: string;
  channel: string;
  subject?: string;
  content: string;
  variables: string[];
  usageCount: number;
}

export interface PrefilledMessage {
  templateId: number;
  templateName: string;
  channel: string;
  subject?: string;
  content: string;
}

export interface TrackBehaviorRequest {
  actionType: string;
  contextType?: string;
  contextId?: number;
}

export interface SuggestionFeedback {
  suggestionType: string;
  contextType?: string;
  contextId?: number;
  wasAccepted: boolean;
  feedbackText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SmartSuggestionsApiService {
  private apiUrl = `${environment.apiBaseUrl}/v1/smart-suggestions`;

  constructor(private http: HttpClient) {}

  getSuggestionsForDossier(dossierId: number): Observable<SmartSuggestion[]> {
    return this.http.get<SmartSuggestion[]>(`${this.apiUrl}/dossier/${dossierId}`);
  }

  trackBehavior(request: TrackBehaviorRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/track-behavior`, request);
  }

  submitFeedback(feedback: SuggestionFeedback): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/feedback`, feedback);
  }

  getMessageTemplates(category?: string, channel?: string): Observable<MessageTemplate[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    if (channel) {
      params = params.set('channel', channel);
    }
    return this.http.get<MessageTemplate[]>(`${this.apiUrl}/message-templates`, { params });
  }

  getPrefilledMessage(templateId: number, dossierId: number): Observable<PrefilledMessage> {
    const params = new HttpParams().set('dossierId', dossierId.toString());
    return this.http.get<PrefilledMessage>(
      `${this.apiUrl}/message-templates/${templateId}/prefill`,
      { params }
    );
  }

  recordTemplateUsage(templateId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/message-templates/${templateId}/use`, {});
  }
}
