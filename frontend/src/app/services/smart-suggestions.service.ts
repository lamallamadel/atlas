import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, shareReplay, map } from 'rxjs/operators';
import { 
  SmartSuggestionsApiService, 
  SmartSuggestion, 
  MessageTemplate, 
  PrefilledMessage,
  TrackBehaviorRequest,
  SuggestionFeedback 
} from './smart-suggestions-api.service';

@Injectable({
  providedIn: 'root'
})
export class SmartSuggestionsService {
  private suggestionsCache = new Map<number, { data: SmartSuggestion[], timestamp: number }>();
  private templatesCache: { data: MessageTemplate[], timestamp: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  private currentSuggestionsSubject = new BehaviorSubject<SmartSuggestion[]>([]);
  public currentSuggestions$ = this.currentSuggestionsSubject.asObservable();

  constructor(private apiService: SmartSuggestionsApiService) {}

  getSuggestionsForDossier(dossierId: number, forceRefresh = false): Observable<SmartSuggestion[]> {
    const cached = this.suggestionsCache.get(dossierId);
    const now = Date.now();

    if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_TTL) {
      this.currentSuggestionsSubject.next(cached.data);
      return of(cached.data);
    }

    return this.apiService.getSuggestionsForDossier(dossierId).pipe(
      tap(suggestions => {
        this.suggestionsCache.set(dossierId, { data: suggestions, timestamp: now });
        this.currentSuggestionsSubject.next(suggestions);
      }),
      catchError(error => {
        console.error('Error loading suggestions:', error);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  trackBehavior(actionType: string, contextType?: string, contextId?: number): void {
    const request: TrackBehaviorRequest = {
      actionType,
      contextType,
      contextId
    };

    this.apiService.trackBehavior(request).subscribe({
      next: () => {
        if (contextId && contextType === 'DOSSIER') {
          this.invalidateCache(contextId);
        }
      },
      error: (error) => {
        console.error('Error tracking behavior:', error);
      }
    });
  }

  acceptSuggestion(suggestion: SmartSuggestion, dossierId: number): void {
    this.trackBehavior(suggestion.actionType, 'DOSSIER', dossierId);
    
    const feedback: SuggestionFeedback = {
      suggestionType: suggestion.suggestionType,
      contextType: 'DOSSIER',
      contextId: dossierId,
      wasAccepted: true
    };

    this.apiService.submitFeedback(feedback).subscribe({
      error: (error) => console.error('Error submitting feedback:', error)
    });
  }

  dismissSuggestion(suggestion: SmartSuggestion, dossierId: number, reason?: string): void {
    const feedback: SuggestionFeedback = {
      suggestionType: suggestion.suggestionType,
      contextType: 'DOSSIER',
      contextId: dossierId,
      wasAccepted: false,
      feedbackText: reason
    };

    this.apiService.submitFeedback(feedback).subscribe({
      next: () => {
        const current = this.currentSuggestionsSubject.value;
        const updated = current.filter(s => s !== suggestion);
        this.currentSuggestionsSubject.next(updated);
      },
      error: (error) => console.error('Error submitting feedback:', error)
    });
  }

  getMessageTemplates(category?: string, channel?: string, forceRefresh = false): Observable<MessageTemplate[]> {
    const now = Date.now();

    if (!forceRefresh && this.templatesCache && (now - this.templatesCache.timestamp) < this.CACHE_TTL) {
      return of(this.templatesCache.data).pipe(
        map(templates => this.filterTemplates(templates, category, channel))
      );
    }

    return this.apiService.getMessageTemplates(category, channel).pipe(
      tap(templates => {
        if (!category && !channel) {
          this.templatesCache = { data: templates, timestamp: now };
        }
      }),
      catchError(error => {
        console.error('Error loading message templates:', error);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  getPrefilledMessage(templateId: number, dossierId: number): Observable<PrefilledMessage> {
    return this.apiService.getPrefilledMessage(templateId, dossierId).pipe(
      tap(() => {
        this.apiService.recordTemplateUsage(templateId).subscribe({
          error: (error) => console.error('Error recording template usage:', error)
        });
      }),
      catchError(error => {
        console.error('Error getting prefilled message:', error);
        return throwError(() => error);
      })
    );
  }

  getSuggestionIcon(actionType: string): string {
    const iconMap: Record<string, string> = {
      'SEND_MESSAGE': 'mail',
      'CREATE_APPOINTMENT': 'calendar_today',
      'UPDATE_STATUS': 'update',
      'SEND_EMAIL': 'mail',
      'SEND_SMS': 'sms',
      'CALL_CLIENT': 'phone'
    };
    return iconMap[actionType] || 'lightbulb';
  }

  getSuggestionColor(priority: number): string {
    if (priority >= 9) return 'warn';
    if (priority >= 7) return 'accent';
    return 'primary';
  }

  getConfidenceLabel(score?: number): string {
    if (!score) return '';
    if (score >= 0.9) return 'Très pertinent';
    if (score >= 0.7) return 'Pertinent';
    if (score >= 0.5) return 'Peut-être pertinent';
    return '';
  }

  invalidateCache(dossierId?: number): void {
    if (dossierId) {
      this.suggestionsCache.delete(dossierId);
    } else {
      this.suggestionsCache.clear();
    }
  }

  invalidateTemplatesCache(): void {
    this.templatesCache = null;
  }

  private filterTemplates(templates: MessageTemplate[], category?: string, channel?: string): MessageTemplate[] {
    return templates.filter(template => {
      if (category && template.category !== category) return false;
      if (channel && template.channel !== channel) return false;
      return true;
    });
  }
}
