import { TestBed } from '@angular/core/testing';
import { SmartSuggestionsService } from './smart-suggestions.service';
import { SmartSuggestionsApiService, SmartSuggestion } from './smart-suggestions-api.service';
import { of, throwError } from 'rxjs';

describe('SmartSuggestionsService', () => {
  let service: SmartSuggestionsService;
  let apiServiceSpy: jasmine.SpyObj<SmartSuggestionsApiService>;

  const mockSuggestions: SmartSuggestion[] = [
    {
      suggestionType: 'FOLLOW_UP',
      title: 'Rappeler le client',
      description: 'Inactif depuis 3 jours',
      actionType: 'SEND_MESSAGE',
      priority: 8,
      confidenceScore: 0.85
    }
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SmartSuggestionsApiService', [
      'getSuggestionsForDossier',
      'trackBehavior',
      'submitFeedback',
      'getMessageTemplates',
      'getPrefilledMessage',
      'recordTemplateUsage'
    ]);

    TestBed.configureTestingModule({
      providers: [
        SmartSuggestionsService,
        { provide: SmartSuggestionsApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(SmartSuggestionsService);
    apiServiceSpy = TestBed.inject(SmartSuggestionsApiService) as jasmine.SpyObj<SmartSuggestionsApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get suggestions for dossier', (done) => {
    apiServiceSpy.getSuggestionsForDossier.and.returnValue(of(mockSuggestions));

    service.getSuggestionsForDossier(123).subscribe(suggestions => {
      expect(suggestions).toEqual(mockSuggestions);
      expect(apiServiceSpy.getSuggestionsForDossier).toHaveBeenCalledWith(123);
      done();
    });
  });

  it('should cache suggestions', (done) => {
    apiServiceSpy.getSuggestionsForDossier.and.returnValue(of(mockSuggestions));

    service.getSuggestionsForDossier(123).subscribe(() => {
      service.getSuggestionsForDossier(123).subscribe(suggestions => {
        expect(suggestions).toEqual(mockSuggestions);
        expect(apiServiceSpy.getSuggestionsForDossier).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  it('should track behavior', () => {
    apiServiceSpy.trackBehavior.and.returnValue(of(void 0));

    service.trackBehavior('SEND_EMAIL', 'DOSSIER', 123);

    expect(apiServiceSpy.trackBehavior).toHaveBeenCalledWith({
      actionType: 'SEND_EMAIL',
      contextType: 'DOSSIER',
      contextId: 123
    });
  });

  it('should accept suggestion', () => {
    apiServiceSpy.trackBehavior.and.returnValue(of(void 0));
    apiServiceSpy.submitFeedback.and.returnValue(of(void 0));

    service.acceptSuggestion(mockSuggestions[0], 123);

    expect(apiServiceSpy.trackBehavior).toHaveBeenCalled();
    expect(apiServiceSpy.submitFeedback).toHaveBeenCalledWith(
      jasmine.objectContaining({ wasAccepted: true })
    );
  });

  it('should dismiss suggestion', () => {
    apiServiceSpy.submitFeedback.and.returnValue(of(void 0));

    service.dismissSuggestion(mockSuggestions[0], 123, 'Not relevant');

    expect(apiServiceSpy.submitFeedback).toHaveBeenCalledWith(
      jasmine.objectContaining({ 
        wasAccepted: false,
        feedbackText: 'Not relevant'
      })
    );
  });

  it('should get suggestion icon', () => {
    expect(service.getSuggestionIcon('SEND_MESSAGE')).toBe('mail');
    expect(service.getSuggestionIcon('CREATE_APPOINTMENT')).toBe('calendar_today');
    expect(service.getSuggestionIcon('UNKNOWN')).toBe('lightbulb');
  });

  it('should get suggestion color', () => {
    expect(service.getSuggestionColor(10)).toBe('warn');
    expect(service.getSuggestionColor(8)).toBe('accent');
    expect(service.getSuggestionColor(5)).toBe('primary');
  });

  it('should get confidence label', () => {
    expect(service.getConfidenceLabel(0.95)).toBe('Très pertinent');
    expect(service.getConfidenceLabel(0.75)).toBe('Pertinent');
    expect(service.getConfidenceLabel(0.55)).toBe('Peut-être pertinent');
    expect(service.getConfidenceLabel(0.3)).toBe('');
    expect(service.getConfidenceLabel()).toBe('');
  });

  it('should handle errors gracefully', (done) => {
    apiServiceSpy.getSuggestionsForDossier.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    service.getSuggestionsForDossier(123).subscribe(suggestions => {
      expect(suggestions).toEqual([]);
      done();
    });
  });

  it('should invalidate cache', (done) => {
    apiServiceSpy.getSuggestionsForDossier.and.returnValue(of(mockSuggestions));

    service.getSuggestionsForDossier(123).subscribe(() => {
      service.invalidateCache(123);
      
      service.getSuggestionsForDossier(123).subscribe(() => {
        expect(apiServiceSpy.getSuggestionsForDossier).toHaveBeenCalledTimes(2);
        done();
      });
    });
  });
});
