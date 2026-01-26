import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SmartSuggestionsApiService, SmartSuggestion, TrackBehaviorRequest, SuggestionFeedback } from './smart-suggestions-api.service';
import { environment } from '../../environments/environment';

describe('SmartSuggestionsApiService', () => {
  let service: SmartSuggestionsApiService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/v1/smart-suggestions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SmartSuggestionsApiService]
    });
    service = TestBed.inject(SmartSuggestionsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get suggestions for dossier', () => {
    const dossierId = 123;
    const mockSuggestions: SmartSuggestion[] = [
      {
        suggestionType: 'FOLLOW_UP',
        title: 'Rappeler le client',
        description: 'Ce dossier est inactif depuis 3 jours',
        actionType: 'SEND_MESSAGE',
        priority: 8,
        confidenceScore: 0.85
      }
    ];

    service.getSuggestionsForDossier(dossierId).subscribe(suggestions => {
      expect(suggestions).toEqual(mockSuggestions);
      expect(suggestions.length).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/dossier/${dossierId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSuggestions);
  });

  it('should track behavior', () => {
    const request: TrackBehaviorRequest = {
      actionType: 'SEND_EMAIL',
      contextType: 'DOSSIER',
      contextId: 123
    };

    service.trackBehavior(request).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/track-behavior`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(null);
  });

  it('should submit feedback', () => {
    const feedback: SuggestionFeedback = {
      suggestionType: 'FOLLOW_UP',
      contextType: 'DOSSIER',
      contextId: 123,
      wasAccepted: true
    };

    service.submitFeedback(feedback).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/feedback`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(feedback);
    req.flush(null);
  });

  it('should get message templates', () => {
    const mockTemplates = [
      {
        id: 1,
        name: 'Relance après 3 jours',
        category: 'FOLLOW_UP',
        channel: 'EMAIL',
        subject: 'Suite à votre demande',
        content: 'Bonjour {{leadName}}...',
        variables: ['leadName', 'annonceTitle'],
        usageCount: 5
      }
    ];

    service.getMessageTemplates('FOLLOW_UP').subscribe(templates => {
      expect(templates).toEqual(mockTemplates);
    });

    const req = httpMock.expectOne(request => 
      request.url === `${apiUrl}/message-templates` && 
      request.params.get('category') === 'FOLLOW_UP'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockTemplates);
  });

  it('should get prefilled message', () => {
    const templateId = 1;
    const dossierId = 123;
    const mockMessage = {
      templateId: 1,
      templateName: 'Relance',
      channel: 'EMAIL',
      subject: 'Suite à votre demande',
      content: 'Bonjour John...'
    };

    service.getPrefilledMessage(templateId, dossierId).subscribe(message => {
      expect(message).toEqual(mockMessage);
    });

    const req = httpMock.expectOne(request =>
      request.url === `${apiUrl}/message-templates/${templateId}/prefill` &&
      request.params.get('dossierId') === dossierId.toString()
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockMessage);
  });

  it('should record template usage', () => {
    const templateId = 1;

    service.recordTemplateUsage(templateId).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/message-templates/${templateId}/use`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
