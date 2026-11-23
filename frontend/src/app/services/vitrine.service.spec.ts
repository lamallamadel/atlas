import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VitrineService, publicLeadErrorMessage } from './vitrine.service';

describe('VitrineService', () => {
  let service: VitrineService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(VitrineService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends a demo request without choosing the agency or the case type', () => {
    let result: { success: boolean } | undefined;
    service.submitDemoRequest({
      nom: 'Karim', email: 'k@agence.ma', tel: '+212600000000', ville: 'Tanger',
      actorType: 'agence', needs: ['CRM & leads'], message: 'Bonjour', consent: true
    }).subscribe(r => (result = r));

    const req = httpMock.expectOne('/api/v1/portal/leads');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.requestType).toBe('DEMO');
    expect(req.request.body.consent).toBe(true);
    expect(req.request.body.name).toBe('Karim');
    expect(req.request.body.message).toContain('Ville : Tanger');
    expect(req.request.body.caseType).toBeUndefined();
    expect(req.request.body.leadSource).toBeUndefined();
    req.flush({ status: 'RECEIVED' }, { status: 201, statusText: 'Created' });

    expect(result).toEqual({ success: true });
  });

  it('sends a contact request with an optional phone', () => {
    service.submitContactRequest({
      nom: 'Sara', email: 's@ex.ma', tel: '', sujet: 'autre', message: 'Question', consent: true
    }).subscribe();

    const req = httpMock.expectOne('/api/v1/portal/leads');
    expect(req.request.body.requestType).toBe('CONTACT');
    expect(req.request.body.phone).toBeNull();
    req.flush({ status: 'RECEIVED' });
  });

  it('propagates server errors instead of faking success', () => {
    let failed = false;
    service.submitPublicLead({ requestType: 'INFO', name: 'X', phone: '1', consent: false })
      .subscribe({ error: () => (failed = true) });

    httpMock.expectOne('/api/v1/portal/leads').flush(
      { detail: 'CONSENT_REQUIRED: ...' }, { status: 400, statusText: 'Bad Request' });

    expect(failed).toBe(true);
  });

  it('turns server error codes into readable French messages', () => {
    expect(publicLeadErrorMessage({ error: { detail: 'CONSENT_REQUIRED: x' } }))
      .toContain('Cochez la case');
    expect(publicLeadErrorMessage({ error: { detail: 'ANNONCE_NOT_FOUND: x' } }))
      .toContain("n'est plus disponible");
    expect(publicLeadErrorMessage(new Error('network'))).toContain('Réessayez');
  });
});
